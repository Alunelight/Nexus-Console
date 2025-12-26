import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route } from "../routes/register";

// Extract component for testing
const RegisterPage = Route.options.component!;

// Mock the API client
vi.mock("../api/client", () => ({
  customFetch: vi.fn(),
}));

// Mock auth store
const mockLogin = vi.fn();
vi.mock("../stores/authStore", () => ({
  useAuthStore: vi.fn((selector) => {
    const state = {
      user: null,
      isAuthenticated: false,
      login: mockLogin,
      logout: vi.fn(),
    };
    return selector(state);
  }),
}));

// Mock router
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({
      children,
      to,
      ...props
    }: {
      children: React.ReactNode;
      to: string;
      [key: string]: unknown;
    }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

describe("RegisterPage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it("renders registration form", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <RegisterPage />
      </QueryClientProvider>
    );

    expect(screen.getByLabelText(/邮箱/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^密码$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/确认密码/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /注册/i })).toBeInTheDocument();
  });

  it("shows validation error for password mismatch", async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={queryClient}>
        <RegisterPage />
      </QueryClientProvider>
    );

    const emailInput = screen.getByLabelText(/邮箱/i);
    const passwordInput = screen.getByLabelText(/^密码$/i);
    const confirmPasswordInput = screen.getByLabelText(/确认密码/i);
    const submitButton = screen.getByRole("button", { name: /注册/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "Password123");
    await user.type(confirmPasswordInput, "Different123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/两次输入的密码不一致/i)).toBeInTheDocument();
    });
  });

  it("shows validation error for weak password", async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={queryClient}>
        <RegisterPage />
      </QueryClientProvider>
    );

    const emailInput = screen.getByLabelText(/邮箱/i);
    const passwordInput = screen.getByLabelText(/^密码$/i);
    const submitButton = screen.getByRole("button", { name: /注册/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "weak");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/密码至少需要 8 个字符/i)).toBeInTheDocument();
    });
  });

  it("displays error message on registration failure", async () => {
    const { customFetch } = await import("../api/client");
    vi.mocked(customFetch).mockRejectedValueOnce({
      error: "Error",
      detail: "Email test@example.com is already registered",
      status_code: 400,
      code: "EMAIL_ALREADY_EXISTS",
    });

    const user = userEvent.setup();
    render(
      <QueryClientProvider client={queryClient}>
        <RegisterPage />
      </QueryClientProvider>
    );

    const emailInput = screen.getByLabelText(/邮箱/i);
    const passwordInput = screen.getByLabelText(/^密码$/i);
    const confirmPasswordInput = screen.getByLabelText(/确认密码/i);
    const submitButton = screen.getByRole("button", { name: /注册/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "Password123");
    await user.type(confirmPasswordInput, "Password123");
    await user.click(submitButton);

    // Wait for error message to appear (useErrorHandler converts EMAIL_ALREADY_EXISTS to Chinese)
    await waitFor(
      () => {
        expect(screen.getByText(/该邮箱已被注册/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
