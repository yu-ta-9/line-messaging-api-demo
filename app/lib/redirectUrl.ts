export const validateRedirectUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    return urlObj.origin === process.env.FRONTEND_URL;
  } catch (e) {
    return false;
  }
};
