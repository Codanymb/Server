const { db } = require("../database/db");


const createCart = (req, res) => {
    const user_id = req.user.id;

    if (!user_id) return res.status(400).json({ error: "User ID is required" });

    const cart_query = "SELECT * FROM cart WHERE user_id = ?";
    db.get(cart_query, [user_id], (err, existingCart) => {
        if (err) return res.status(500).json({ error: "Database error", details: err.message });

        if (existingCart) {
            return res.status(200).json({ message: "Cart already exists", cart_id: existingCart.cart_id });
        }

        const add_query = "INSERT INTO cart (user_id) VALUES (?)";
        db.run(add_query, [user_id], function (err) {
            if (err) return res.status(500).json({ error: "Failed to create cart", details: err.message });
            res.status(201).json({ message: "Cart created", cart_id: this.lastID });
        });
    });
};

// Add item to cart, auto-creates cart if missing
const addToCart = (req, res) => {
    const user_id = req.user.id;
    const { art_piece_id, quantity, price } = req.body;

    if (!user_id || !art_piece_id || quantity <= 0 || !price) {
        return res.status(400).json({ error: "Invalid input data" });
    }

    // Check if user has a cart
    const checkCartQuery = "SELECT cart_id FROM cart WHERE user_id = ?";
    db.get(checkCartQuery, [user_id], (err, cart) => {
        if (err) return res.status(500).json({ error: "Database error", details: err.message });

        const insertItem = (cart_id) => {
            // Check if item already in cart
            const checkArtQuery = "SELECT * FROM cart_items WHERE art_piece_id = ? AND cart_id = ?";
            db.get(checkArtQuery, [art_piece_id, cart_id], (err, item) => {
                if (err) return res.status(500).json({ error: "Database error", details: err.message });

                if (item) {
                    // Update quantity if item exists
                    const newQuantity = Number(item.quantity) + Number(quantity);
                    const updateQuery = "UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?";
                    db.run(updateQuery, [newQuantity, item.cart_item_id], function (err) {
                        if (err) return res.status(500).json({ error: "Update failed", details: err.message });
                        res.json({ message: "Item quantity updated", cart_item_id: item.cart_item_id });
                    });
                } else {
                    // Insert new item
                    const insertQuery = "INSERT INTO cart_items (cart_id, art_piece_id, quantity, price) VALUES (?, ?, ?, ?)";
                    db.run(insertQuery, [cart_id, art_piece_id, quantity, price], function (err) {
                        if (err) return res.status(500).json({ error: "Insert failed", details: err.message });
                        res.status(201).json({ message: "Item added to cart", cart_item_id: this.lastID });
                    });
                }
            });
        };

        if (cart) {
            insertItem(cart.cart_id); // Cart exists
        } else {
            // Auto-create cart if missing
            const add_query = "INSERT INTO cart (user_id) VALUES (?)";
            db.run(add_query, [user_id], function (err) {
                if (err) return res.status(500).json({ error: "Failed to create cart", details: err.message });
                insertItem(this.lastID);
            });
        }
    });
};


const removeFromCart = (req, res) => {
    const { art_piece_id } = req.body;
    const user_id = req.user.id;

    if (!art_piece_id) return res.status(400).json({ error: "No art piece provided" });

    const checkQuery = "SELECT cart_id FROM cart WHERE user_id = ?";
    db.get(checkQuery, [user_id], (err, cart) => {
        if (err) return res.status(500).json({ error: "Database error", details: err.message });
        if (!cart) return res.status(404).json({ error: "Cart not found" });

        const deleteQuery = "DELETE FROM cart_items WHERE cart_id = ? AND art_piece_id = ?";
        db.run(deleteQuery, [cart.cart_id, art_piece_id], function (err) {
            if (err) return res.status(500).json({ error: "Database error", details: err.message });
            if (this.changes === 0) return res.status(404).json({ error: "Item not found in cart" });
            res.status(200).json({ message: "Item removed from cart", art_piece_id });
        });
    });
};


const viewCart = (req, res) => {
    const user_id = req.user.id;

    const checkCartQuery = "SELECT cart_id FROM cart WHERE user_id = ?";
    db.get(checkCartQuery, [user_id], (err, cart) => {
        if (err) return res.status(500).json({ error: "Database error", details: err.message });
        if (!cart) return res.status(404).json({ error: "Cart not found" });

        const itemsQuery = `
            SELECT ci.cart_item_id, ci.quantity, ci.price, ap.art_piece_id, ap.title, ap.description, ap.image
            FROM cart_items ci
            JOIN art_pieces ap ON ci.art_piece_id = ap.art_piece_id
            WHERE ci.cart_id = ?
        `;
        db.all(itemsQuery, [cart.cart_id], (err, items) => {
            if (err) return res.status(500).json({ error: "Database error", details: err.message });
            res.status(200).json({ cart_id: cart.cart_id, items });
        });
    });
};


const checkOut = (req, res) => {
    const user_id = req.user.id;
    const { order_type, delivery_address } = req.body;

    if (!["pickup", "delivery"].includes(order_type)) return res.status(400).json({ error: "Invalid order type." });
    if (order_type === "delivery" && !delivery_address) return res.status(400).json({ error: "Delivery address required." });

    const cartQuery = "SELECT cart_id FROM cart WHERE user_id = ?";
    db.get(cartQuery, [user_id], (err, cart) => {
        if (err) return res.status(500).json({ error: "Database error", details: err.message });
        if (!cart) return res.status(404).json({ error: "No active cart found" });

        const cart_id = cart.cart_id;
        const itemQuery = `
            SELECT ci.art_piece_id, ci.quantity AS requested_quantity, ci.price, ap.quantity AS available_quantity
            FROM cart_items ci
            JOIN art_pieces ap ON ci.art_piece_id = ap.art_piece_id
            WHERE ci.cart_id = ?
        `;
        db.all(itemQuery, [cart_id], (err, items) => {
            if (err) return res.status(500).json({ error: "Failed to retrieve cart items", details: err.message });
            if (!items.length) return res.status(400).json({ error: "Cart is empty." });

            for (let item of items) {
                if (item.requested_quantity > item.available_quantity) {
                    return res.status(400).json({ error: `Not enough stock for art piece ${item.art_piece_id}` });
                }
            }

            const totalAmount = items.reduce((sum, item) => sum + item.price * item.requested_quantity, 0);

            const orderQuery = `
                INSERT INTO orders (user_id, order_type, delivery_address, total_amount)
                VALUES (?, ?, ?, ?)
            `;
            db.run(orderQuery, [user_id, order_type, order_type === "pickup" ? null : delivery_address, totalAmount], function (err) {
                if (err) return res.status(500).json({ error: "Failed to create order", details: err.message });

                const order_id = this.lastID;

               
                const insertOrderItem = db.prepare("INSERT INTO order_items (order_id, art_piece_id, quantity, price) VALUES (?, ?, ?, ?)");
                const updateQuantity = db.prepare("UPDATE art_pieces SET quantity = quantity - ? WHERE art_piece_id = ?");

                for (let item of items) {
                    insertOrderItem.run(order_id, item.art_piece_id, item.requested_quantity, item.price);
                    updateQuantity.run(item.requested_quantity, item.art_piece_id);
                }

                insertOrderItem.finalize();
                updateQuantity.finalize();

                db.run("DELETE FROM cart_items WHERE cart_id = ?", [cart_id]);

                res.status(200).json({ message: "Order placed successfully", order_id, total_amount: totalAmount });
            });
        });
    });
};


const makePayment = (req, res) => {
    const { order_id, payer_card_number, payer_name, payer_expiry, payer_card_type, receiver_name, receiver_card_number, amount } = req.body;

    if (!order_id || !payer_card_number || !payer_card_type || !receiver_card_number || !amount) {
        return res.status(400).json({ error: "Missing required payment fields" });
    }

    const query = `
        INSERT INTO payments (order_id, payer_card_number, payer_name, payer_expiry, payer_card_type, receiver_name, receiver_card_number, amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.run(query, [order_id, payer_card_number, payer_name, payer_expiry, payer_card_type, receiver_name, receiver_card_number, amount], function (err) {
        if (err) return res.status(500).json({ error: "Payment failed", details: err.message });

        db.run("UPDATE orders SET status = 'pending' WHERE order_id = ?", [order_id]);
        res.status(201).json({ message: "Payment successful", payment_id: this.lastID, order_id });
    });
};


const viewOrders = (req, res) => {
    const user_id = req.user.id;
    const query = "SELECT * FROM orders WHERE user_id = ? ORDER BY Date_created DESC";

    db.all(query, [user_id], (err, orders) => {
        if (err) return res.status(500).json({ error: "Database error", details: err.message });
        res.status(200).json({ orders });
    });
};


const viewOrderDetails = (req, res) => {
    const { order_id } = req.params;

    const query = `
        SELECT o.*, oi.art_piece_id, oi.quantity, oi.price, ap.title, ap.image
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN art_pieces ap ON oi.art_piece_id = ap.art_piece_id
        WHERE o.order_id = ?
    `;
    db.all(query, [order_id], (err, orderDetails) => {
        if (err) return res.status(500).json({ error: "Database error", details: err.message });
        if (!orderDetails.length) return res.status(404).json({ error: "Order not found" });
        res.status(200).json({ order: orderDetails[0], items: orderDetails });
    });
};

const CartCounter = (req, res) => {
    const user_id = req.user.id; 
    // Sum all quantities of items, then Join with the cart table
    const query = `
        SELECT SUM(quantity) AS count              
        FROM cart_items                             
        INNER JOIN cart ON cart_items.cart_id = cart.cart_id   
        WHERE cart.user_id = ?                     
    `;

    db.get(query, [user_id], (err, row) => {
        if (err) return res.status(500).json({ error: "Database error", details: err.message });

        res.json({ count: row.count || 0 });  // Return 0 if cart is empty
    });
};

module.exports = {
    createCart,
    addToCart,
    removeFromCart,
    viewCart,
    checkOut,
    makePayment,
    viewOrders,
    viewOrderDetails,
    CartCounter
};
