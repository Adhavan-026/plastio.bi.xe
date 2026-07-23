// GitHub's stable "latest release" URL pattern — always serves whatever
// asset with this exact name was most recently published, so a new
// release never requires touching any page that links here. See
// electron-builder.yml (pins the installer's filename to match) and
// docs/DESKTOP_BUILD.md (how to publish a release).
export const DESKTOP_DOWNLOAD_URL =
  "https://github.com/Adhavan-026/plastio.bi.xe/releases/latest/download/clickOne-Setup.exe";
