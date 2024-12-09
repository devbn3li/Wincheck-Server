const router = require('express').Router();
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const serviceRoutes = require('./servicesRoutes');
const requestRoutes = require('./requestRoutes');

router.use("/auth",authRoutes);
router.use("/user",userRoutes);
router.use("/services",serviceRoutes);
router.use("/request", requestRoutes);

module.exports = router;