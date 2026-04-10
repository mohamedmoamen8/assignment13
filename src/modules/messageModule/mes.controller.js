import { Router } from "express";
import { upload } from "../../middleware/upload.middleware.js";
const router = Router();
router.post("/send-message", upload ({dest:"messages", name:"sarahaMessages" }).array('attachments', 5), async (req, res) => { 
const  attachments= req.files.map(file=>file.path);
  const { to, body } = req.body;
  const {data} = await sendMessageService({ to, body, attachments });
  return successRes({
    res,
    data,
    status: 200,
    message: "message sent",
  });
});
router.get("/get-messages", async (req, res) => {
  const userId = req.user._id;
  const { data } = await getUserMessagesService(userId);
  return successRes({
    res,
    data,
    status: 200,
    message: "messages retrieved",
  });
});
export default router;