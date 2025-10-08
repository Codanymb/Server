const jwt = require ("jsonwebtoken");
const {db} = require ("../database/db");
const bodyParser = require("body-parser");


const AddArt  = async( req, res) =>{
    const {title,description ,id_number ,estimated_value, category, availability, is_active, image} = req.body;
     

    if (!title || !description || !id_number ||!estimated_value || !category || !availability || !is_active || !image)
    {
        return res.status(400).json({msg:  "fill all the fields", status: false})
    }

    const checkQuery = "SELECT artist_id FROM artists WHERE id_number = ? AND  is_active= 'yes'";
    db.get(checkQuery,[id_number] , (err, artist) => {
        if(err){
            console.error("Database error", err.message);
            return res.status(500).json({msg: "Internal server error", status: false});
        }

        if(!artist){
            return res.status(400).json({msg: "No artist with that id found", status:false});
        }
        

        const add_query = "INSERT INTO art_pieces (title,description ,artist_id ,estimated_value, category, availability, is_active, image) VALUES (?,?,?,?,?,?,?,?)";

        db.run(add_query, [title,description ,artist.artist_id ,estimated_value, category, availability, is_active, image], function(err){

        if(err){
            console.error('Error inserting into art piece table:',  err.message)
            return res.status(500).json({"msg": "cannot add art piece", "Status": false});
        }
       return res.status(201).json({"msg" : "Successfully Added the art peice", "Status": true})
       

    });
    }); 
};

const getAllArts = (req, res) => {
    const getQuery = `
        SELECT 
            art_piece_id, 
            title,
            description,
            artist_id,
            estimated_value,
            category,
            availability,
            is_active,
            image,
            quantity
        FROM art_pieces
    `;
    db.all(getQuery, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Getting all the art pieces failed", details: err.message });
        }
        return res.status(200).json({ arts: rows });
    });
};

const getEachArt = (req, res) => {
    const art_piece_id = req.params.art_piece_id;

    const getQuery = "SELECT * FROM art_pieces WHERE art_piece_id = ?";

    db.get(getQuery, [art_piece_id], (err, art) => {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).json({ msg: "Internal server error", error: err.message });
        }

        if (!art) {
            return res.status(404).json({ msg: "Art piece not found" });
        }

        return res.status(200).json({ art });
    });
};

const updateArt = (req, res) => {
  const art_piece_id = req.params.art_piece_id;
  const { title, description, estimated_value, category, availability, is_active, image } = req.body;

  const update_query = `
    UPDATE art_pieces 
    SET title = ?, description = ?, estimated_value = ?, category = ?, availability = ?, is_active = ?, image = ?
    WHERE art_piece_id = ?
  `;

  db.run(
    update_query,
    [title, description, estimated_value, category, availability, is_active, image, art_piece_id],
    function (err) {
      if (err) {
        console.error("Database error:", err.message);
        return res.status(500).json({ msg: "Internal server error", error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ msg: "Art piece not found or no changes made" });
      }

      res.json({ msg: "Art piece updated successfully", status: true });
    }
  );
};


const deleteArt = (req,res) => {
    const art_piece_id= req.params.art_piece_id;

    const deleteQuery = "DELETE FROM art_pieces WHERE art_piece_id=?";

    db.run(deleteQuery, [art_piece_id], function(err){

      if(err){
        return res.status(500).json({error: "Failed to delete", details: err.message});
      }

      if(this.changes===0){
        return res.status(404).json({message: "Art piece not found"})
      }

      return res.status(200).json({message: "Art piece Deleted!"})
    })
}



  // Return art pieces that are available + active
  // If you have a table that links art_pieces to exhibitions (say ex_art or assignment),
  // you should exclude those already assigned.
  const getAvailableArt = (req, res) => {
  const { exhibition_id, category } = req.query;

  let query = `
    SELECT ap.*
    FROM art_pieces ap
    WHERE ap.availability = 'available'
      AND ap.is_active = 'yes'
  `;

  const params = [];

  if (category) {
    query += ` AND LOWER(ap.category) = LOWER(?)`;
    params.push(category);
  }

  if (exhibition_id) {
    query += ` AND ap.art_piece_id NOT IN (
      SELECT art_piece_id FROM exhibition_art WHERE exhibition_id = ?
    )`;
    params.push(exhibition_id);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Error fetching available art:", err.message);
      return res.status(500).json({ status: false, error: err.message });
    }

    return res.json({ status: true, art_pieces: rows });
  });
};



 module.exports ={
          AddArt, getAllArts, updateArt, deleteArt,getEachArt,getAvailableArt
    }


