const jwt = require ("jsonwebtoken");
const {db} = require ("../database/db");
const bodyParser = require("body-parser");


const ExRegister = async (req, res) => {
   
};

const AddExhibition  = async( req, res) =>{
    const {ex_title,ex_date , ex_space, ex_category,  ex_status, ex_poster, ex_price} = req.body;
     
    const add_query = "INSERT INTO exhibitions (ex_title,ex_date ,ex_space, ex_category,  ex_status, ex_poster,ex_price) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.run(add_query, [ex_title,ex_date ,ex_space, ex_category,  ex_status, ex_poster,ex_price], function(err){

        if(err){
            console.error('Error inserting into Exhibtion table:',  err.message)
            return res.status(500).json({"msg": "Internal server error", "Statu": false});
        }
        res.status(201).json({"Message" : "Successfully created the Exhibition", "Status": true})

      
    })
}


const getAllEx = (req,res) => {

    const getQuery = "SELECT exhibition_id, ex_title, ex_date  , ex_space , ex_category, ex_status, ex_poster, ex_price FROM exhibitions";
    db.all(getQuery, [], (err,rows) => {
        if (err){
            return res.status(500).json({ error: "Getting all the artists failed", details: err.message})
        };
        return res.status(200).json({ users: rows})
    })
}

const getEachEx = (req, res) => {
  const exhibition_id = req.params.exhibition_id;

  const getQuery = "SELECT * FROM exhibitions WHERE exhibition_id = ?";

  db.get(getQuery, [exhibition_id], (err, exhibition) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!exhibition) {
      return res.status(404).json({ message: "No exhibition found" });
    }

    // ✅ Ensure field names match frontend expectation
    return res.json({
      Exhibition: {
        exhibition_id: exhibition.exhibition_id,
        ex_title: exhibition.ex_title,
        ex_date: exhibition.ex_date,
        ex_status: exhibition.ex_status,
        ex_space: exhibition.ex_space,
        ex_category: exhibition.ex_category,
        ex_poster: exhibition.ex_poster,
        ex_price: exhibition.ex_price,
      },
    });
  });
};



const getExhibitionArt = (req, res) => {
  const exhibition_id = req.params.exhibition_id;

  const query = `
    SELECT ap.*
    FROM art_pieces ap
    JOIN exhibition_art_pieces eap ON ap.art_piece_id = eap.art_piece_id
    WHERE eap.exhibition_id = ?;
  `;

  db.all(query, [exhibition_id], (err, rows) => {
    if (err) {
      return res.status(500).json({ msg: "Error fetching art pieces", error: err });
    }

    return res.status(200).json({ art_pieces: rows });
  });
};



const updateEx = (req, res) => {
    const exhibition_id = req.params.exhibition_id;
    const { ex_title, ex_date, ex_space, ex_category, ex_status, ex_poster, ex_price } = req.body;

    const update_query = `
        UPDATE exhibitions 
        SET ex_title = ?, ex_date = ?, ex_status = ?, ex_category = ?, ex_space = ?, ex_poster = ?, ex_price = ?
        WHERE exhibition_id = ?
    `;

    db.run(update_query, [ex_title, ex_date, ex_status, ex_category, ex_space, ex_poster, ex_price, exhibition_id], function(err) {
        if (err) {
            return res.status(500).json({ msg: "Internal server error", error: err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ msg: "Exhibition not found or no changes made" });
        }

        res.json({ msg: "Exhibition updated successfully", status: true });
    });
};

const deleteEx = (req,res) => {
    const exhibition_id= req.params.exhibition_id;

    const deleteQuery = "DELETE FROM exhibitions WHERE exhibition_id=?";

    db.run(deleteQuery, [exhibition_id], function(err){

      if(err){
        return res.status(500).json({error: "Failed to delete", details: err.message});
      }

      if(this.changes===0){
        return res.status(404).json({message: "Exhibition not found"})
      }

      return res.status(200).json({message: "Exhibition Deleted!"})
    })
}


const addArtPieceToEx = (req, res) => {
    const {art_piece_id, exhibition_id} = req.body; 
    const checkAvailability = "SELECT availability ,category FROM art_pieces WHERE art_piece_id = ?";
    db.get(checkAvailability, [art_piece_id], (err, artPiece) => {

        if(err){
            return res.status(500).json({msg: "Internal server error"});  
        }

        if(!artPiece) {
            return res.status(404).json({msg: "No art piece found"});
        }

        if(artPiece.availability !== "available"){
            return res.status(400).json ({msg: "The art piece is not available"})
        }

        const CheckExhibition ="SELECT ex_status, ex_category FROM exhibitions WHERE exhibition_id = ?";
        db.get(CheckExhibition, [exhibition_id], (err, exhibition) => {

            if(err){
                return res.status(500).json({msg: "Internal server error"})
            }

            if(!exhibition){
                return res.status(404).json({msg: "No exhibition found"})
            }

             const category = artPiece.category === exhibition.ex_category ||  exhibition.ex_category === "Photography";

            if (!category) {
                return res.status(400).json({ msg: "The art piece and exhibition category do not match" });
            }

            
            if (exhibition.ex_status === "ongoing" || exhibition.ex_status === "completed"){
                return res.status(500).json({msg: "You cannot add art piece to this exhibition"})
                console.message(exhibition.ex_status)


            }

            const add_query = "INSERT INTO exhibition_art_pieces (exhibition_id, art_piece_id) VALUES (?,?)";
            db.run (add_query, exhibition_id, art_piece_id, function(err){
                if(err){
                    console.error("Error adding art piece", err.message)
                    return res.status(400).json({msg: "Internal server error"})
                }
                
                    return res.status(200).json({msg: "Successfully added the Art piece on an exhibition"})

                // const updateAvailability =" UPDATE art_pieces SET availability = 'displayed' WHERE art_piece_id = ? ";
                // db.run(updateAvailability, [art_piece_id], (err) => {
                //     if(err){
                //         console.error("Error updating the availability", err.message)
                //         return res.status(500).json({msg: "Error updating the availability"});
                //     }

                //     return res.status(200).json({msg: "Successfully added the Art piece on an exhibition"})
                // })
            })
        })

    })

}

const removeArtPieceFromEx = (req, res) => {
    const { exhibition_id, art_piece_id } = req.params;

    console.log("Removing art piece", art_piece_id, "from exhibition", exhibition_id);

    const checkQuery = "SELECT * FROM exhibition_art_pieces WHERE exhibition_id = ? AND art_piece_id = ?";
    db.get(checkQuery, [exhibition_id, art_piece_id], (err, row) => {
        if (err) return res.status(500).json({ msg: "Internal server error" });
        if (!row) return res.status(404).json({ msg: "This art piece is not part of the exhibition" });

        const deleteQuery = "DELETE FROM exhibition_art_pieces WHERE exhibition_id = ? AND art_piece_id = ?";
        db.run(deleteQuery, [exhibition_id, art_piece_id], function (err) {
            if (err) return res.status(500).json({ msg: "Internal server error" });

            const updateAvailability = "UPDATE art_pieces SET availability = 'available' WHERE art_piece_id = ?";
            db.run(updateAvailability, [art_piece_id], (err) => {
                if (err) return res.status(500).json({ msg: "Error updating availability" });
                return res.status(200).json({ msg: "Art piece successfully removed from exhibition" });
            });
        });
    });
};

const getAvailableArt = (req, res) => {
  const query = "SELECT * FROM art_pieces WHERE availability = 'available'";
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ msg: "Internal server error" });
    return res.json({ art_pieces: rows });
  });
};








 module.exports ={
          AddExhibition,getAllEx,updateEx, deleteEx,getEachEx,addArtPieceToEx, getExhibitionArt,removeArtPieceFromEx,getAvailableArt
    }


