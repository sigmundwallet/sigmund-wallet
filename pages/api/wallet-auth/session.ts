import { deleteCookie } from "cookies-next";
import { getSession } from "modules/shared/utils/session";
import { NextApiHandler } from "next";

const sessionHandler: NextApiHandler = async (req, res) => {
  const session = await getSession({ req });
  if (!session) {
    deleteCookie("sigmund_session", { req, res });
    return res.status(401).json({
      error: "Session not found",
    });
  }

  return res.status(200).json(session);
};

export default sessionHandler;
