import app from "../src/index";

export const onRequest: PagesFunction = async (context) => {
  return app.fetch(
    context.request,
    context.env,
    {
      waitUntil: (promise: Promise<unknown>) => context.waitUntil(promise),
      passThroughOnException: () => context.passThroughOnException()
    } as unknown as ExecutionContext
  );
};




