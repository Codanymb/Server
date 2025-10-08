const express = require("express");
const {AddExhibition,getAllEx,updateEx, deleteEx,getEachEx, addArtPieceToEx, getExhibitionArt, removeArtPieceFromEx,getAvailableArt}= require ("../controllers/ExController");
const router = express.Router();
const { owner, authenticatedUser , clerk} = require("../middleware/authMiddleware");

router.post("/Add" , AddExhibition);
router.get("/getEx" ,  getAllEx);
router.get("/getEachEx/:exhibition_id" ,  getEachEx);
router.put('/update/:exhibition_id', updateEx);
router.delete('/delete/:exhibition_id', owner,deleteEx);
router.post("/AssignArt", addArtPieceToEx)
router.get("/getExhibitionArt/:exhibition_id", getExhibitionArt);
router.delete("/DeleteArt/:exhibition_id/:art_piece_id", removeArtPieceFromEx);
router.get("/getAvailableArt", getAvailableArt);








module.exports = router