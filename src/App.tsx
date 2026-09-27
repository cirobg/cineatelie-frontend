import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router";
import { bootstrapSession } from "./shared/auth/bootstrap";
import { router } from "./app/router";

const queryClient = new QueryClient();

function App() {
  // "A page reload keeps the user signed in" (implementation plan, M1) -- the access token
  // is memory-only, so every fresh load must attempt a silent refresh from the cookie before
  // the router can correctly decide whether to show /login (ProtectedLayout otherwise sees
  // an empty session on every reload, logged in or not).
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    bootstrapSession().finally(() => setBootstrapped(true));
  }, []);

  if (!bootstrapped) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
