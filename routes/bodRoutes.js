import express from "express";
const router = express.Router();
import { getNewBox, getNewSet, shuffleSet, drawDomino } from "../controllers/domController.js";

router.get('/newbox', getNewBox)

router.get('/newset', getNewSet)

router.post('/shuffleset/:id', shuffleSet)

router.post('/draw/:id/:count', drawDomino)

export default router