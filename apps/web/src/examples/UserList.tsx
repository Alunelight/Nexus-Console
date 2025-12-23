/**
 * 用户列表组件示例
 * 展示如何使用 Orval 生成的类型安全 API Hooks
 */

import { useListUsersApiV1UsersGet, useCreateUserApiV1UsersPost } from '../api/endpoints/users/users';
import type { UserCreate } from '../api/models';

export function UserList() {
  // 使用生成的 Query Hook - 完全类型安全
  const { data: users, isPending, isError } = useListUsersApiV1UsersGet({
    skip: 0,
    limit: 10,
  });

  // 使用生成的 Mutation Hook
  const createUser = useCreateUserApiV1UsersPost();

  const handleCreateUser = () => {
    const newUser: UserCreate = {
      email: 'test@example.com',
      name: 'Test User',
    };

    createUser.mutate(
      { data: newUser },
      {
        onSuccess: () => {
          console.log('用户创建成功');
        },
      }
    );
  };

  if (isPending) return <div>加载中...</div>;
  if (isError) return <div>加载失败</div>;

  return (
    <div>
      <h1>用户列表</h1>
      <button onClick={handleCreateUser}>创建用户</button>
      <ul>
        {users?.map((user) => (
          <li key={user.id}>
            {user.name} - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}
