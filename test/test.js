var auth = require('../controllers/authentication.controller');
var projectmanagement = require('../controllers/projectmanagement.controller');
let mongoose = require("mongoose");
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();
var uuid = require('uuid-v4');
chai.use(chaiHttp);


describe('Check Login', () => {
    it('It should able to Lgon with Valid Credentials', (done) => {
        let req = {
            username: "test1",
            password: "manage"
        }
        chai.request(server)
            .post('/api/signin')
            .send(req)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('status');
                res.body.status.should.have.property('code').eql(0);
                done();
            });
    });

    it('It should Fail with Invalid Credentials', (done) => {
        let req = {
            username: "test1q",
            password: "manage"
        }
        chai.request(server)
            .post('/api/signin')
            .send(req)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('status');
                res.body.status.should.have.property('code').eql(-1);
                done();
            });
    });
});



describe('Project Management', () => {
    var newProject = "";
    it('It should able to create project', (done) => {
        let req = request();
        chai.request(server)
            .post('/api/projectmanagement/createProject')
            .send(req)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('status');
                res.body.status.should.have.property('code').eql(0);
                res.body.status.should.have.property('message');
                res.body.status.message.should.not.be.empty;
                newProject = res.body.result;
                done();
            });
    });

  
 
    // it('It should not allow creating duplicate Project Ids', (done) => {
    //     let req = request(newProject.projectId);
    //     chai.request(server)
    //         .post('/api/projectmanagement/createProject')
    //         .send(req)
    //         .end((err, res) => {
    //             res.should.have.status(200);
    //             res.body.should.be.a('object');
    //             res.body.should.have.property('status');
    //             res.body.status.should.have.property('code').eql(-1);
    //             res.body.status.should.have.property('message');
    //             res.body.status.message.should.not.be.empty;
    //             done();
    //         });
    // });

    it('It should get all the projects', (done) => {
        let req = {};
        chai.request(server)
            .post('/api/projectmanagement/getProjects')
            .send(req)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('status');
                res.body.status.should.have.property('code').eql(0);
                res.body.status.should.have.property('message');
                res.body.status.message.should.not.be.empty;
                done();
            });
    });
    it('It should get the selected Project', (done) => {
        let req = { _id: newProject._id};
        chai.request(server)
            .post('/api/projectmanagement/viewProject')
            .send(req)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('status');
                res.body.status.should.have.property('code').eql(0);
                res.body.status.should.have.property('message');
                res.body.status.message.should.not.be.empty;
                res.body.result.should.have.property('_id').eql(newProject._id);
                done();
            });
    });
    it('It should get null result for invalid projectid', (done) => {
        let req = { _id: '5c4183226c9af7760c58dcee'};
        chai.request(server)
            .post('/api/projectmanagement/viewProject')
            .send(req)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('status');
                res.body.status.should.have.property('code').eql(0);
                res.body.status.should.have.property('message');
                res.body.status.message.should.not.be.empty;
                done();
            });
    });

    it('It should able to update for the given Project Id', (done) => {
        let req = newProject;
        chai.request(server)
            .post('/api/projectmanagement/viewProject')
            .send(req)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('status');
                res.body.status.should.have.property('code').eql(0);
                res.body.status.should.have.property('message');
                res.body.status.message.should.not.be.empty;
                done();
            });
    });

    it('It should able to Delete the Project', (done) => {
        let req = { _id: newProject._id};;
        chai.request(server)
            .post('/api/projectmanagement/deleteProject')
            .send(req)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('status');
                res.body.status.should.have.property('code').eql(0);
                res.body.status.should.have.property('message');
                res.body.status.message.should.not.be.empty;
                done();
            });
    });
});

describe('Dashboard Management', () => {
    it('It should get the Dashboard Metrics', (done) => {
        let req = {}
        chai.request(server)
            .post('/api/generateMetrics')
            .send(req)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('status');
                res.body.status.should.have.property('code').eql(0);
                res.body.status.should.have.property('message');
                res.body.status.message.should.not.be.empty;
                res.body.result.should.have.property('estimationReport');
                res.body.result.should.have.property('defectDensityReport');
                res.body.result.should.have.property('programReport');
                res.body.result.should.have.property('totalSprintsReport');
                res.body.result.should.have.property('defectReport');
                done();
            });
    });
});



function request() {
    return { "projectId": "", "name": "Product Analytics", "sector": "Pharma", "startDate": "2019-01-01T16:30:13.000Z", "exceptedEndDate": "", "projectOwner": { "fullName": "D Shah", "firstName": "", "lastName": "", "roles": [], "userId": "", "emailId": "" }, "itLead": { "fullName": "A Shah", "firstName": "", "lastName": "", "roles": [], "userId": "", "emailId": "" }, "isValidatedSystem": true, "description": "", "technicalStack": ["JavaScript", "Angular 6", "Angular 7", "Node.js", "Express"], "vendors": [{ "id": "", "name": "DF", "type": "Development", "poc": { "fullName": "R Chintapalli", "firstName": "", "lastName": "", "roles": [], "userId": "", "emailId": "" }, "location": "" }], "initialEstimations": 1200, "finalEstimations": 75, "totalNoOfSprints": 2, "sprintList": [{ "startDate": "2019-01-01T16:30:13.000Z", "endDate": "2019-01-15T16:30:13.000Z", "storyPoints": 37, "resourceCount": 4, "issueCount": 11, "sprintStatus": "", "no": 1 }, { "startDate": "2019-01-15T16:30:13.000Z", "endDate": "2019-01-28T18:30:00.000Z", "storyPoints": 38, "resourceCount": 4, "issueCount": 10, "sprintStatus": "", "no": 2 }], "sandBox": [{ "sprintNo": 1, "expectedDeployment": "2019-01-15T16:30:13.000Z", "actualDeployment": "2019-01-16T16:30:13.000Z", "environment": "Sandbox", "status": true }], "staging": [{ "sprintNo": 1, "expectedDeployment": "2019-01-16T16:30:13.000Z", "actualDeployment": "2019-01-16T16:30:13.000Z", "environment": "Staging", "status": false }], "production": [{ "sprintNo": 1, "expectedDeployment": "2019-01-16T16:30:13.000Z", "actualDeployment": "2019-01-20T16:30:13.000Z", "environment": "Production", "status": true }], "status": "In Progress" }
}

