import { deleteCookie } from "cookies-next";
import { getSession } from "modules/shared/utils/session";
import { NextApiHandler } from "next";

const logoutHandler: NextApiHandler = async (req, res) => {
  if (req.headers.purpose === "prefetch") {
    return res.status(204).end();
  }
  deleteCookie("sigmund_session", { req, res });
  return res.redirect("/wallet/open");
};

export default logoutHandler;
