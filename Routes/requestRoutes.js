const { sendRequest, acceptRequest, rejectRequest, getAllRequests, completeRequest } = require("../Controllers/requestController");
const protect = require("../middlewares/protect");
const router = require("express").Router();

router.get("/",protect, getAllRequests);

router.post("/",protect, sendRequest );
router.post("/accept/:id",protect, acceptRequest );
router.post("/reject/:id",protect, rejectRequest );
router.post("/complete/:id",protect, completeRequest );

module.exports = router;
