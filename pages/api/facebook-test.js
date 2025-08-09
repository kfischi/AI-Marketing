export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  if (!process.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    return res.json({
      success: false,
      error: "Missing Facebook token",
      message: "Add FACEBOOK_PAGE_ACCESS_TOKEN to environment variables"
    });
  }
  
  return res.json({
    success: true,
    message: "Facebook endpoint working!",
    hasToken: !!process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
    hasPageId: !!process.env.FACEBOOK_PAGE_ID
  });
}
