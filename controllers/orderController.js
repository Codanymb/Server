const { db } = require("../database/db")


const getAllOrders = (req, res)=> {
    const getQuey = "SELECT * FROM orders";
    db.all (getQuey, [], (err, rows) => {
        if(err){
            return res.status(500).json({err: "Failed to get products"})
        }
        return res.status(200).json({orders: rows})
    })
}

const UserOrder = (req, res) => {
    const user_id = req.user.id;

    const orderQuery = "SELECT * FROM orders WHERE user_id=?";
    db.all(orderQuery, [user_id], (err,order)=>{

        if(err){
            return res.status(500).json({error: "e1", details: err.message})
        }

        if(!order){
            return res.json({"message": "No order"})
        }

        return res.json({"My order": order})
    })
}

const  getEachOrder = (req, res) => {
    const order_id = req.params.order_id;


    const getQuery = "SELECT * FROM orders WHERE order_id = ?";
    db.get(getQuery, [order_id], (err, order) => {
        if(err){
            return res.status(500).json({details: err.message})
        }

        if(!order){
            return res.status(404).json({"Error": "There is no order with this ID"})
        }
    return res.json({"Order": order});

    })
}

const updateOrderStatus = (req, res) => {
  const { order_id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'paid', 'shipped', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  const query = `
    UPDATE orders
    SET status = ?
    WHERE order_id = ?
  `;

  db.run(query, [status, order_id], function (err) {
    if (err) {
      console.error("Error updating order status:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.status(200).json({ message: "Order status updated successfully" });
  });
};

module.exports = { updateOrderStatus };



module.exports = {
     getAllOrders,UserOrder,getEachOrder,updateOrderStatus
}