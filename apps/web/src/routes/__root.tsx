import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="p-2 flex gap-2 border-b">
        <Link to="/" className="[&.active]:font-bold">
          首页
        </Link>
        <Link to="/users" className="[&.active]:font-bold">
          用户
        </Link>
        <Link to="/about" className="[&.active]:font-bold">
          关于
        </Link>
      </div>
      <hr />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});
