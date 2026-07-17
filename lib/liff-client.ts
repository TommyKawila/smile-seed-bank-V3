import liff from "@line/liff";

let initPromise: Promise<void> | null = null;
let initLiffId: string | null = null;

export async function ensureLiffReady(liffId: string): Promise<typeof liff> {
  const id = liffId.trim();
  if (!id) {
    throw new Error("missing_liff_id");
  }

  if (initPromise && initLiffId === id) {
    await initPromise;
    return liff;
  }

  initLiffId = id;
  initPromise = liff.init({ liffId: id }).catch((err: unknown) => {
    initPromise = null;
    initLiffId = null;
    throw err;
  });

  await initPromise;
  return liff;
}

export { liff };
