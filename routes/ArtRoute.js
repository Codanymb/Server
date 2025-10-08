const express = require("express");
const {AddArt,getAllArts, updateArt, deleteArt, getEachArt, getAvailableArt}= require ("../controllers/ArtController");
const router = express.Router();
const { owner, authenticatedUser , clerk} = require("../middleware/authMiddleware");

router.post("/AddArt" ,  AddArt);
router.get("/getArt" ,  getAllArts);
router.get("/getEachArt/:art_piece_id" ,  getEachArt);
router.put('/updateArt/:art_piece_id', updateArt);
router.delete('/:art_piece_id', owner,deleteArt);
router.get("/available" ,  getAvailableArt);




module.exports = router