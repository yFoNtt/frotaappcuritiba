import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  render: vi.fn(),
  appModuleLoaded: vi.fn(),
}));

vi.mock("react-dom/client", () => ({
  createRoot: vi.fn(() => ({ render: mocks.render })),
}));

vi.mock("../App.tsx", () => {
  mocks.appModuleLoaded();
  return { default: () => null };
});

describe("bootstrap da aplicação", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    mocks.render.mockReset();
    mocks.appModuleLoaded.mockReset();
    document.body.innerHTML = '<div id="root"></div>';
  });

  it("mostra o fallback sem carregar o App quando as envs estão ausentes", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");

    const { startup } = await import("../main");
    await startup;

    expect(mocks.appModuleLoaded).not.toHaveBeenCalled();
    expect(mocks.render).toHaveBeenCalledOnce();

    const fallback = mocks.render.mock.calls[0][0];
    expect(fallback.props.missingEnv).toEqual([
      "VITE_SUPABASE_URL",
      "VITE_SUPABASE_PUBLISHABLE_KEY",
    ]);
  });

  it("carrega o App dentro do ErrorBoundary quando as envs existem", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://backend.example.test");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "public-test-key");

    const { startup } = await import("../main");
    await startup;

    expect(mocks.appModuleLoaded).toHaveBeenCalledOnce();
    expect(mocks.render).toHaveBeenCalledOnce();

    const boundary = mocks.render.mock.calls[0][0];
    expect(boundary.props.children).toBeTruthy();
  });
});