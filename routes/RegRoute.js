const express = require("express");
const {registerForExhibition, getAllReg,getEachReg, confirmRegistration, getUserRegistrations}= require ("../controllers/RegController");
const router = express.Router();
const { owner, authenticatedUser , clerk} = require("../middleware/authMiddleware");

router.post("/exReg" ,authenticatedUser,  registerForExhibition);
router.get("/getReg" , getAllReg);
router.get("/getEachReg/:registration_id" ,clerk,  getEachReg);
router.put('/registration/:registration_id/confirm', confirmRegistration);
router.get("/getUserRegistrations",authenticatedUser,  getUserRegistrations);








module.exports = router