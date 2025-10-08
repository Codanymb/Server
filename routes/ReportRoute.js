const express = require("express");
const router = express.Router();
const { getExhibitionRegistrations, getArtAvailability , getArtStatusBreakdown,
    getPopularArtCategories,
    getTopArtPieces,
     } = require("../controllers/ReportController");
const db = require("../database/db")


router.get("/exhibition-registrations", getExhibitionRegistrations);
router.get("/art-availability", getArtAvailability);
router.get("/art-status-breakdown", getArtStatusBreakdown);
router.get("/popular-art-categories", getPopularArtCategories);
router.get("/top-art-pieces", getTopArtPieces);





module.exports = router;


   