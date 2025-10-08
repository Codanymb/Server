const { db } = require('../database/db'); // Destructure db from exported object

/**
 * Get total registrations per exhibition category
 * Shows which exhibition categories are most popular based on registration count
 * Used by managers to identify trending exhibition types
 */
const getExhibitionRegistrations = (req, res) => {
    const query = `
        SELECT 
            e.ex_category,
            COUNT(DISTINCT r.registration_id) AS total_registrations,
            COALESCE(SUM(r.attendees), 0) AS total_attendees
        FROM exhibitions e
        LEFT JOIN registrations r ON e.exhibition_id = r.exhibition_id AND r.status = 'submitted'
        GROUP BY e.ex_category
        HAVING COUNT(DISTINCT r.registration_id) > 0
        ORDER BY total_registrations DESC;
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching exhibition registrations:', err.message);
            return res.status(500).json({ 
                status: false,
                error: err.message 
            });
        }
        res.json({ 
            status: true,
            data: rows 
        });
    });
};

/**
 * Get available art pieces per category
 * Shows distribution of available artwork across different categories
 * Helps managers understand inventory status by category
 */
const getArtAvailability = (req, res) => {
    const query = `
        SELECT 
            category,
            COUNT(art_piece_id) AS available_artworks,
            SUM(quantity) AS total_quantity
        FROM art_pieces
        WHERE availability = 'available' AND is_active = 'yes'
        GROUP BY category
        ORDER BY available_artworks DESC;
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching art availability:', err.message);
            return res.status(500).json({ 
                status: false,
                error: err.message 
            });
        }
        res.json({ 
            status: true,
            data: rows 
        });
    });
};

/**
 * Get art pieces status breakdown
 * Shows count of art pieces by availability (available vs displayed)
 * and active status (active vs inactive)
 * Provides managers with overall inventory status
 */
const getArtStatusBreakdown = (req, res) => {
    const query = `
        SELECT 
            availability,
            is_active,
            COUNT(art_piece_id) AS count,
            SUM(quantity) AS total_quantity
        FROM art_pieces
        GROUP BY availability, is_active
        ORDER BY availability, is_active;
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching art status breakdown:', err.message);
            return res.status(500).json({ 
                status: false,
                error: err.message 
            });
        }
        res.json({ 
            status: true,
            data: rows 
        });
    });
};

/**
 * Get most popular art piece categories by purchase quantity
 * Shows which art piece categories are most frequently bought
 * Helps managers understand customer preferences and demand
 */
/**
 * Get most popular art piece categories by sales
 * Ranks categories by number of items sold and revenue
 */
const getPopularArtCategories = (req, res) => {
    const query = `
        SELECT 
            ap.category,
            COUNT(DISTINCT oi.order_item_id) AS total_orders,
            SUM(oi.quantity) AS total_quantity_sold,
            SUM(oi.price * oi.quantity) AS total_revenue
        FROM order_items oi
        INNER JOIN art_pieces ap ON oi.art_piece_id = ap.art_piece_id
        INNER JOIN orders o ON oi.order_id = o.order_id
        WHERE o.status != 'cancelled'   -- ✅ allow pending, paid, shipped, completed
        GROUP BY ap.category
        HAVING total_quantity_sold > 0
        ORDER BY total_quantity_sold DESC;
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching popular art categories:', err.message);
            return res.status(500).json({ 
                status: false,
                error: err.message 
            });
        }
        res.json({ 
            status: true,
            data: rows 
        });
    });
};


const getTopArtPieces = (req, res) => {
    const query = `
        SELECT 
            ap.title AS name,
            ap.category,
            SUM(oi.quantity) AS quantity_sold
        FROM order_items oi
        JOIN art_pieces ap ON oi.art_piece_id = ap.art_piece_id
        JOIN orders o ON oi.order_id = o.order_id
        WHERE o.status != 'cancelled'
        GROUP BY oi.art_piece_id
        ORDER BY quantity_sold DESC
        LIMIT 3;
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching top art pieces:', err.message);
            return res.status(500).json({ status: false, error: err.message });
        }
        res.json({ status: true, data: rows });
    });
};



/**
 * Get exhibition performance metrics
 * Shows detailed statistics for each exhibition including:
 * - Total registrations, attendees, and revenue
 * - Number of art pieces displayed
 * Helps managers evaluate exhibition success
 */
const getExhibitionPerformance = (req, res) => {
    const query = `
        SELECT 
            e.exhibition_id,
            e.ex_title,
            e.ex_category,
            e.ex_status,
            e.ex_date,
            COUNT(DISTINCT r.registration_id) AS total_registrations,
            SUM(r.attendees) AS total_attendees,
            COUNT(DISTINCT eap.art_piece_id) AS art_pieces_count,
            (COUNT(DISTINCT r.registration_id) * e.ex_price) AS estimated_revenue
        FROM exhibitions e
        LEFT JOIN registrations r ON e.exhibition_id = r.exhibition_id AND r.status = 'submitted'
        LEFT JOIN exhibition_art_pieces eap ON e.exhibition_id = eap.exhibition_id
        GROUP BY e.exhibition_id
        ORDER BY e.ex_date DESC;
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching exhibition performance:', err.message);
            return res.status(500).json({ 
                status: false,
                error: err.message 
            });
        }
        res.json({ 
            status: true,
            data: rows 
        });
    });
};

/**
 * Get art inventory value by category
 * Calculates total estimated value of art pieces per category
 * Shows both available and total inventory value
 * Helps managers understand financial value of collections
 */
const getArtInventoryValue = (req, res) => {
    const query = `
        SELECT 
            category,
            COUNT(art_piece_id) AS total_pieces,
            SUM(CASE WHEN availability = 'available' THEN 1 ELSE 0 END) AS available_pieces,
            SUM(estimated_value * quantity) AS total_value,
            SUM(CASE WHEN availability = 'available' THEN estimated_value * quantity ELSE 0 END) AS available_value,
            AVG(estimated_value) AS avg_value
        FROM art_pieces
        WHERE is_active = 'yes'
        GROUP BY category
        ORDER BY total_value DESC;
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching art inventory value:', err.message);
            return res.status(500).json({ 
                status: false,
                error: err.message 
            });
        }
        res.json({ 
            status: true,
            data: rows 
        });
    });
};

/**
 * Get overall dashboard statistics
 * Provides high-level summary metrics including:
 * - Total art pieces (active/inactive)
 * - Total exhibitions by status
 * - Total registrations
 * - Total revenue
 * Used for dashboard overview display
 */
const getDashboardStats = (req, res) => {
    const queries = {
        // Total active art pieces
        activeArt: `SELECT COUNT(*) as count FROM art_pieces WHERE is_active = 'yes'`,
        
        // Total available art pieces
        availableArt: `SELECT COUNT(*) as count FROM art_pieces WHERE availability = 'available' AND is_active = 'yes'`,
        
        // Total exhibitions by status
        exhibitions: `SELECT ex_status, COUNT(*) as count FROM exhibitions GROUP BY ex_status`,
        
        // Total registrations
        registrations: `SELECT COUNT(*) as count FROM registrations WHERE status = 'submitted'`,
        
        // Total revenue
        revenue: `SELECT SUM(e.ex_price) as total FROM registrations r JOIN exhibitions e ON r.exhibition_id = e.exhibition_id WHERE r.status = 'submitted'`
    };

    const stats = {};
    let completedQueries = 0;
    const totalQueries = Object.keys(queries).length;

    // Execute all queries
    Object.keys(queries).forEach(key => {
        db.all(queries[key], [], (err, rows) => {
            if (err) {
                console.error(`Error fetching ${key}:`, err.message);
                stats[key] = { error: err.message };
            } else {
                stats[key] = rows;
            }
            
            completedQueries++;
            
            // Send response when all queries complete
            if (completedQueries === totalQueries) {
                res.json({ 
                    status: true,
                    data: stats 
                });
            }
        });
    });
};

module.exports = {
    getExhibitionRegistrations,
    getArtAvailability,
    getArtStatusBreakdown,
    getPopularArtCategories,
    getTopArtPieces
};