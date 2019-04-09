let router = require('express').Router();
var passport = require('passport');
var config = require('../config/database');
require('../config/passport')(passport);
var jwt = require('jsonwebtoken');


var authController = require('../controllers/authentication.controller');
var productlabelController = require('../controllers/productlabel.controller');
var documentController = require('../controllers/document.controller');
var dashboardController = require('../controllers/dashboard.controller');
var favouriteController = require('../controllers/favourite.controller');

//authController
router.route('/auth/register').post(authController.new);
router.route('/signin').post(authController.signin);

//Project Controller
router.route('/labelling/createProject').post(productlabelController.newProject);
router.route('/labelling/getProjects').post(productlabelController.getProjects);
router.route('/labelling/updateProject').post(productlabelController.updateProject);
router.route('/labelling/viewProject').post(productlabelController.viewProject);
router.route('/labelling/compare').post(productlabelController.compare);


// File Upload
router.route('/labelling/upload').post(documentController.uploadFile);

// File Upload
router.route('/labelling/getAllProjects').post(dashboardController.getAllProjects);

router.post('/markFavorite', favouriteController.create);
router.post('/updateFavorite/:id', favouriteController.update);
router.post('/unMarksFavorite', favouriteController.delete);
router.post('/getFavorites', favouriteController.getAll);


// Verify JWT Jokens from REST
function verifyToken(req, res, next) {
    var token = req.headers['authorization'];
    if (!token)
        return res.status(403).send({ auth: false, message: 'No token provided.' });
    jwt.verify(token.split(' ')[1], config.secret, function (err, decoded) {
        if (err)
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        req.userId = decoded.id;
        next();
    });
}

module.exports = router;