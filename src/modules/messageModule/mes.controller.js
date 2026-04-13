import { Router } from "express";
import { upload } from "../../middleware/upload.middleware.js";
import { successRes } from "../../utils/res.handle.js";
import { sendMessage, getUserMessages } from "./mes.service.js";
import { authentication } from "../../middleware/auth.middeleware.js";
const router = Router();
router.post("/send-message", upload ({dest:"messages", name:"sarahaMessages" }).array('attachments', 5), async (req, res) => { 
const  attachments= req.files.map(file=>file.path);
  const { to, body } = req.body;
  const {data} = await sendMessage({ to, body, attachments });
  return successRes({
    res,
    data,
    status: 200,
    message: "message sent",
  });
});
router.get("/get-messages", authentication, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { data } = await getUserMessages(userId);
    return successRes({
      res,
      data,
      status: 200,
      message: "messages retrieved",
    });
  } catch (error) {
    next(error);
  }
});
export default router;