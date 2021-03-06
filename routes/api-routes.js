let router = require('express').Router();
var passport = require('passport');
var config = require('../config/database');
require("../config/passport")(passport);
var jwt = require('jsonwebtoken');


var authController = require('../controllers/authentication.controller');
var productlabelController = require('../controllers/productlabel.controller');
var documentController = require('../controllers/document.controller');
var dashboardController = require('../controllers/dashboard.controller');
var favouriteController = require('../controllers/favourite.controller');
var commentsController = require('../controllers/comments.controller');
var checkListController = require('../controllers/checklist.controller');
//var preferenceController = require('../controllers/preference.controller');
var configController = require('../controllers/config.controller')
//authController
router.route('/auth/register').post(authController.new);
router.route('/auth/signin').post(authController.signin);
 
//Project Controller
router.route('/labelling/createProject').post(productlabelController.newProject);
router.route('/labelling/getProjects').post(productlabelController.getProjects);
router.route('/labelling/updateProject').post(productlabelController.updateProject);
router.route('/labelling/viewProject').post(productlabelController.viewProject);
router.route('/labelling/viewConflictProject').post(productlabelController.viewConflictProject);
router.route('/labelling/compare').post(productlabelController.compare);
router.route('/labelling/commentAck').post(productlabelController.commentAck);


// File Upload
router.route('/labelling/upload').post(documentController.uploadFile);
router.route('/labelling/re-upload').post(documentController.reUploadFile);
router.route('/labelling/deleteDocument').post(documentController.deleteFile);

//router.route('/labelling/getAllProjects').post(dashboardController.getAllProjects);

//Favorites 
router.post('/markFavorite', favouriteController.create);
//router.post('/updateFavorite/:id', favouriteController.update);
router.post('/unMarkFavorite', favouriteController.delete);
router.post('/getFavorites', favouriteController.getAll);

//Audit/History
router.post("/labelling/auditHistory", documentController.auditHistory);
//MappingSpec
router.post('/labelling/getMappingSpec', productlabelController.getMappingSpec);

// File Upload for countryConfig
router.route("/labelling/configFileUpload").post(configController.configFileUpload);
router.route("/labelling/createCountryConfig").post(configController.createCountryConfig);
router.route("/labelling/createRuleConfig").post(configController.createRuleConfig);
router.route("/labelling/getAllConfig").post(configController.getAllConfig);
router.route("/labelling/deleteConfig").post(configController.deleteConfig);
router.route("/labelling/updateRuleConfig").post(configController.updateRuleConfig);
//router.route("/labelling/getPythonPayload").post(configController.getPythonPayload);

//CheckList

router.post("/checkList", checkListController.getAllCheckList);

//dashboard
router.post("/labelling/dashboard", dashboardController.getCount);


//Comments
router.route("/labelling/getAllComments").post(commentsController.getAllComments);
router.route("/labelling/createComments").post(commentsController.createComments);
router.route("/labelling/updateComments").post(commentsController.updateComments);
router.route("/labelling/deleteComments").post(commentsController.deleteComments);

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