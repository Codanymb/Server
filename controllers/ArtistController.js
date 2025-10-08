const jwt = require ("jsonwebtoken");
const {db} = require ("../database/db");
const bodyParser = require("body-parser");


const AddArtist  = async( req, res) =>{
    const {first_name,surname ,id_number ,is_active} = req.body;
     
    const add_query = "INSERT INTO artists (first_name,surname , id_number, is_active) VALUES (?, ?, ?, ?)";
    db.run(add_query, [first_name,surname ,  id_number, is_active], function(err){

        if(err){
            console.error('Error inserting into Artist table:',  err.message)
            return res.status(500).json({"msg": "Internal server error", "Status": false});
        }
        res.status(201).json({"Message" : "Successfully Added the artist", "Status": true})

      
    })
}

const getAllArtists = (req,res) => {

    const getQuery = "SELECT artist_id, first_name, surname, is_active, id_number FROM artists"

    db.all(getQuery, [], (err,rows) => {
        if (err){
            return res.status(500).json({ error: "Getting all the artists failed", details: err.message})
        };
        return res.status(200).json({ users: rows})
    })
}

const getEachArtist = (req, res) => {
  const artist_id = req.params.artist_id;

  const getQuery = "SELECT * FROM artists WHERE artist_id = ?";

  db.get(getQuery, [artist_id], (err, artist) => {
    if (err) {
      console.error("Database error:", err.message);
      return res
        .status(500)
        .json({ msg: "Internal server error", error: err.message });
    }

    if (!artist) {
      return res.status(404).json({ msg: "Artist not found" });
    }

    return res.status(200).json({ artist });
  });
};

const updateArtist = (req, res) => {
    const artist_id = req.params.artist_id;
    const { first_name, surname, id_number, is_active} = req.body;

    const update_query = `
        UPDATE artists 
        SET first_name = ?, surname = ?, is_active = ? , id_number = ?
        WHERE artist_id = ? `;

    db.run(update_query, [first_name, surname, is_active,id_number,  artist_id], function(err) {
        if (err) {
            return res.status(500).json({ msg: "Internal server error", error: err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ msg: "Artist not found or no changes made" });
        }

        res.json({ msg: "Artist updated successfully", status: true });
    });
};

const deleteArtist = (req,res) => {
    const artist_id= req.params.artist_id;

    const deleteQuery = "DELETE FROM artists WHERE artist_id=?";

    db.run(deleteQuery, [artist_id], function(err){

      if(err){
        return res.status(500).json({error: "Failed to delete", details: err.message});
      }

      if(this.changes===0){
        return res.status(404).json({message: "Artist not found"})
      }

      return res.status(200).json({message: "Artist Deleted!"})
    })
}

 module.exports ={
          AddArtist, getAllArtists,updateArtist, deleteArtist,getEachArtist
    }


