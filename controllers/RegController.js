const jwt = require ("jsonwebtoken");
const {db} = require ("../database/db");
const bodyParser = require("body-parser");


const registerForExhibition = (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ msg: "User not authenticated" });
    }
    const user_id = req.user.id;
    const { exhibition_id, attendees, registration_type } = req.body;

    if (!exhibition_id || !attendees || !registration_type) {
        return res.status(400).json({ msg: "Missing required fields" });
    }

    if (registration_type !== "individual" && registration_type !== "group") {
        return res.status(400).json({ msg: "Wrong registration type", status: false });
    }

    const numAttendees = parseInt(attendees, 10);
    if (isNaN(numAttendees) || numAttendees < 1) {
        return res.status(400).json({ msg: "Invalid number of attendees" });
    }

    const checkSpaceQuery = "SELECT ex_space, ex_status FROM exhibitions WHERE exhibition_id = ?";

    db.get(checkSpaceQuery, [exhibition_id], (err, exhibition) => {
        if (err) {
            console.error("Error checking exhibition space:", err);
            return res.status(500).json({ msg: "Server error" });
        }

        if (!exhibition) return res.status(404).json({ msg: "Exhibition not found" });
        if (exhibition.ex_status !== "coming") {
            return res.status(400).json({ msg: "You can no longer register for this exhibition" });
        }

        const countQuery = `
            SELECT COALESCE(SUM(attendees), 0) AS total_registered
            FROM registrations
            WHERE exhibition_id = ?
        `;

        db.get(countQuery, [exhibition_id], (err, result) => {
            if (err) {
                console.error("Error counting registrations:", err);
                return res.status(500).json({ msg: "Server error" });
            }

            const space = exhibition.ex_space - result.total_registered;
            if (numAttendees > space) {
                return res.status(400).json({ msg: "Not enough space left" });
            }

            const insertQuery = `
                INSERT INTO registrations (user_id, exhibition_id, attendees, registration_type, status)
                VALUES (?, ?, ?, ?, 'submitted')
            `;
            db.run(insertQuery, [user_id, exhibition_id, numAttendees, registration_type], function (err) {
                if (err) {
                    console.error("Error inserting registration:", err);
                    return res.status(500).json({ msg: "Server error" });
                }
                res.status(200).json({ msg: "Registration successful", registration_id: this.lastID });
            });
        });
    });
};


const getUserRegistrations = (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ msg: "User not authenticated" });
  }

  const userId = req.user.id;
  console.log('Fetching registrations for userId:', userId);

  const getQuery = `
    SELECT 
      r.registration_id,
      r.user_id,
      r.exhibition_id,
      r.attendees,
      r.registration_type,
      r.status,
      e.ex_title AS exhibition_name,
      e.ex_date,
      e.ex_status
    FROM registrations r
    JOIN exhibitions e ON r.exhibition_id = e.exhibition_id
    WHERE r.user_id = ?
    ORDER BY r.registration_id DESC
  `;

  db.all(getQuery, [userId], (err, registrations) => {
    if (err) {
      console.error(' Database error:', err);
      console.error('Query:', getQuery);
      console.error('UserId:', userId);
      return res.status(500).json({ 
        error: 'Database query failed',
        message: err.message 
      });
    }
    
    console.log('Query successful! Found registrations:', registrations.length);
    
    if (registrations.length === 0) {
      console.log(' No registrations found for user_id:', userId);
    }
    
    res.json({ registrations });
  });
};

module.exports = { getUserRegistrations };



const getAllReg = (req, res) => {
  const getQuery = `
    SELECT 
      r.registration_id,
      r.user_id,
      r.exhibition_id,
      r.attendees,
      r.registration_type,
      r.status,
      u.name,
      u.surname,
      u.email,
      e.ex_title,
      e.ex_date
    FROM registrations r
    JOIN USER_TABLE u ON r.user_id = u.user_id
    JOIN exhibitions e ON r.exhibition_id = e.exhibition_id
    ORDER BY r.registration_id DESC
  `;

  db.all(getQuery, [], (err, rows) => {
    if (err) {
      console.error("SQL error:", err.message);
      return res.status(500).json({ 
        error: "Fetching registrations failed", 
        details: err.message 
      });
    }
    return res.status(200).json({ registrations: rows });
  });
};



// Get details for one registration
const getEachReg = (req, res) => {
    const registration_id = req.params.registration_id;

    const getQuery = `
      SELECT 
        r.registration_id,
        r.attendees,
        r.registration_type,
        r.status,
        u.username,
        u.email,
        e.ex_title,
        e.ex_date,
        e.ex_status
      FROM registrations r
      JOIN USER_TABLE u ON r.user_id = u.user_id
      JOIN exhibitions e ON r.exhibition_id = e.exhibition_id
      WHERE r.registration_id = ?
    `;

    db.get(getQuery, [registration_id], (err, registration) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!registration) {
            return res.status(404).json({ message: "No registration found" });
        }
        return res.json({ registration });
    });
};

const confirmRegistration = (req, res) => {
    const { registration_id } = req.params;

    const query = `
        UPDATE registrations
        SET status = 'submitted'
        WHERE registration_id = ? AND status = 'draft'
    `;

    db.run(query, [registration_id], function (err) {
        if (err) {
            console.error("Error confirming registration:", err);
            return res.status(500).json({ msg: "Server error" });
        }

        if (this.changes === 0) {
            return res.status(404).json({ msg: "Registration not found or already confirmed" });
        }

        return res.status(200).json({ msg: "Registration confirmed successfully" });
    });
};




 module.exports ={
          registerForExhibition, getAllReg,getEachReg,confirmRegistration, getUserRegistrations
    }


