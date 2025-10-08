const jwt = require("jsonwebtoken");

const authenticatedUser = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ "msg": "Not authorized, Only Customers allowed" });
    }

    const token = authHeader.split(' ')[1]; // Extract the token part after "Bearer"

    try {
        const user = jwt.verify(token, "private_key");
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ "msg": error.message });
    }
};

const owner = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ "msg": "Not authorized, Only Owner allowed" });
    }

    const token = authHeader.split(' ')[1]; // Extract the token part after "Bearer"

    try {
        const user = jwt.verify(token, "private_key");
        
          if (user.user_type !== "owner") {
            return res.status(403).json({ msg: "Only The Gallery Owners can access this route" });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ "msg": error.message });
    }
};



const clerk = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ "msg3": "Not authorized, Only Clerk allowed" });
    }

    const token = authHeader.split(' ')[1]; 

    try {
        const user = jwt.verify(token, "private_key");
        
        if (user.user_type !== "clerk") {
            return res.status(403).json({ msg2: "Only The Clerk can access" });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ msg2: error.message });
    }
};

const manager = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ "msg3": "Not authorized, Only manager allowed" });
    }

    const token = authHeader.split(' ')[1]; 

    try {
        const user = jwt.verify(token, "private_key");
        
        if (user.user_type !== "manager") {
            return res.status(403).json({ msg2: "Only The manager can access" });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ msg2: error.message });
    }
};





module.exports = {
    authenticatedUser, owner,clerk,manager
};
