const express = require("express");
const {AddArtist, getAllArtists, updateArtist, deleteArtist, getEachArtist}= require ("../controllers/ArtistController");
const router = express.Router();
const { owner, authenticatedUser , clerk} = require("../middleware/authMiddleware");

router.post("/AddA" ,  AddArtist);
router.get("/get" , getAllArtists);
router.get("/getEachArtist/:artist_id" ,  getEachArtist);
router.put('/update/:artist_id',  updateArtist);
router.delete('/deleteA/:artist_id',  deleteArtist);




module.exports = router