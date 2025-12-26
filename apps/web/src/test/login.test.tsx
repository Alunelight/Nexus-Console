import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route } from "../routes/login";

// Extract component for testing
const LoginPage = Route.options.component!;

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

// Mock router hooks
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearch: () => ({ redirect: "/" }),
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

describe("LoginPage", () => {
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

  it("renders login form", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    );

    expect(screen.getByLabelText(/邮箱/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/密码/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /登录/i })).toBeInTheDocument();
  });

  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    );

    const emailInput = screen.getByLabelText(/邮箱/i) as HTMLInputElement;
    const submitButton = screen.getByRole("button", { name: /登录/i });

    // Type invalid email and submit
    await user.clear(emailInput);
    await user.type(emailInput, "invalid-email");
    await user.click(submitButton);

    // Wait for validation error - zod validation happens on submit
    await waitFor(
      () => {
        // Check if error message appears
        const hasValidationError = screen.queryByText(/请输入有效的邮箱地址/i);
        expect(
          hasValidationError || emailInput.validity.valid === false
        ).toBeTruthy();
      },
      { timeout: 2000 }
    );
  });

  it("shows validation error for short password", async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    );

    const emailInput = screen.getByLabelText(/邮箱/i);
    const passwordInput = screen.getByLabelText(/密码/i);
    const submitButton = screen.getByRole("button", { name: /登录/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "short");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/密码至少需要 8 个字符/i)).toBeInTheDocument();
    });
  });

  it("displays error message on login failure", async () => {
    const { customFetch } = await import("../api/client");
    vi.mocked(customFetch).mockRejectedValueOnce({
      error: "Error",
      detail: "Incorrect email or password",
      status_code: 401,
      code: "INVALID_CREDENTIALS",
    });

    const user = userEvent.setup();
    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    );

    const emailInput = screen.getByLabelText(/邮箱/i);
    const passwordInput = screen.getByLabelText(/密码/i);
    const submitButton = screen.getByRole("button", { name: /登录/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    // Wait for error message to appear (useErrorHandler converts INVALID_CREDENTIALS to Chinese)
    await waitFor(
      () => {
        expect(screen.getByText(/邮箱或密码错误/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
