import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyzeRouter from "./analyze";
import transcribeRouter from "./transcribe";
import pincodeRouter from "./pincode";
import complaintsRouter from "./complaints";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyzeRouter);
router.use(transcribeRouter);
router.use(pincodeRouter);
router.use(complaintsRouter);

export default router;
