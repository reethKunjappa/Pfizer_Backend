
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const should = chai.should();
chai.use(chaiHttp);
const path = require('path') 
let currentProjPath = path.resolve("./");
//global var 
var _id   = "";
var _pId  = "";
var _did  =""
var _rdid = "";
var commentsToPass=[]
var confComments;
var sanity_labelfile_id=""

describe("Projects", () => {
  var randomA = Math.floor(Math.random() * 100);
  var rendomB = Math.floor(Math.random() * 1000);
  describe("Create project", () => {
    it("Should create project with all optional and mandatory fields ", done => {
      let req = {
        country: {
          id: "../../assets/countryFlags/saudi_arabia.gif",
          name: "Saudi Arabia"
        },
        createdBy: {
          email: "tester1@pfizer.com",
          name: "Tester Pfizer 1",
          userId: "tester1"
        },
        createdOn: "",
        documents: [],
        drugName: "Test",
        projectName:
          "Sanity-Automation-" +
          Math.floor(Math.random() * 100) +
          "-" +
          Math.floor(Math.random() * 100),
        proprietaryName: "Test"
      };

      chai
        .request(server)
        .post("/api/labelling/createProject")
        .send(req)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.property("status");
          res.body.status.should.have.property("code").eql(0);
          res.body.status.should.have.property("message");
          res.body.status.message.should.be.a("string");
          res.body.result.should.be.a("object");
          res.body.result.conflicted.should.be.a("boolean").eql(false);
          res.body.result.conflicts.should.be.a("object");
          res.body.result.country.should.be.a("object");
          res.body.result.createdAt.should.be.a("string");
          res.body.result.createdBy.should.be.a("object");
          res.body.result.createdOn.should.be.a("string");
          res.body.result.documents.should.be.a("array");
          res.body.result.drugName.should.be.a("string");
          res.body.result.modifiedDate.should.be.a("string");
          res.body.result.projectName.should.be.a("string");
          res.body.result.proprietaryName.should.be.a("string");
          res.body.result.updatedAt.should.be.a("string");
          res.body.result._id.should.be.a("string");
          _pId = res.body.result._id;
          done();
        });
    });

    it("Should create project only with mandatory fields ", done => {
      let req = {
        country: {
          id: "../../assets/countryFlags/saudi_arabia.gif",
          name: "Saudi Arabia"
        },
        createdBy: {
          email: "tester1@pfizer.com",
          name: "Tester Pfizer 1",
          userId: "tester1"
        },
        createdOn: "",
        documents: [],
        projectName: "Sanity-Automation-" + randomA + "-" + rendomB
      };

      chai
        .request(server)
        .post("/api/labelling/createProject")
        .send(req)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.property("status");
          res.body.status.should.have.property("code").eql(0);
          res.body.status.should.have.property("message");
          res.body.status.message.should.be.a("string");
          res.body.result.should.be.a("object");
          res.body.result.conflicted.should.be.a("boolean").eql(false);
          res.body.result.conflicts.should.be.a("object");
          res.body.result.country.should.be.a("object");
          res.body.result.createdAt.should.be.a("string");
          res.body.result.createdBy.should.be.a("object");
          res.body.result.createdOn.should.be.a("string");
          res.body.result.documents.should.be.a("array");
          res.body.result.modifiedDate.should.be.a("string");
          res.body.result.projectName.should.be.a("string");
          res.body.result.updatedAt.should.be.a("string");
          res.body.result._id.should.be.a("string");
          _id = res.body.result._id;
          done();
        });
    });

    it("Should not create dublicate project", done => {
      let req = {
        country: {
          id: "../../assets/countryFlags/saudi_arabia.gif",
          name: "Saudi Arabia"
        },
        createdBy: {
          email: "tester1@pfizer.com",
          name: "Tester Pfizer 1",
          userId: "tester1"
        },
        createdOn: "",
        documents: [],
        projectName: "Sanity-Automation-" + randomA + "-" + rendomB
      };

      chai
        .request(server)
        .post("/api/labelling/createProject")
        .send(req)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.property("status");
          res.body.status.should.have.property("code").eql(-1);
          res.body.status.should.have.property("message");
          res.body.status.message.should.be.a("string");
          res.body.result.should.be.a("object");
          res.body.result.name.should.be.a("string").eql("MongoError");
          done();
        });
    });
  });

  describe("It should get all peojects based on user", () => {
    it("Should get all projects", done => {
      let req = {
        user: {
          email: "admin@pfizer.com",
          name: "Admin Pfizer 1",
          userId: "admin1"
        }
      };

      chai
        .request(server)
        .post("/api/labelling/getProjects")
        .send(req)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.property("status");
          res.body.status.should.have.property("code").eql(0);
          res.body.status.should.have.property("message");
          res.body.status.message.should.be.a("string");
          res.body.result.should.be.a("array");
          done();
        });
    });
  });
});
describe("Favorite", () => {
  it("It should get all user fav project" , done => {
    let req = {
      user: {
        email: "admin@pfizer.com",
        name: "Admin Pfizer 1",
        userId: "admin1"
      }
    };
    chai
      .request(server)
      .post("/api/getFavorites")
      .send(req)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.have.property("status");
        res.body.status.should.have.property("code").eql(0);
        res.body.status.should.have.property("message");
        res.body.status.message.should.be.a("string");
        res.body.result.should.be.a("array");
        done();
      });
  });
  it("It should mark current proj as fav", done => {
    let req = {
      user: {
        email: "admin@pfizer.com",
        name: "Admin Pfizer 1",
        userId: "admin1"
      },
      project: _id
    };
    chai
      .request(server)
      .post("/api/markFavorite")
      .send(req)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.have.property("status");
        res.body.status.should.have.property("code").eql(0);
        res.body.status.should.have.property("message");
        res.body.status.message.should.be.a("string");
        res.body.result.should.be.a("object");
        res.body.result.markedOn.should.be.a("string");
        res.body.result.project.should.be.a("string");
        res.body.result._id.should.be.a("string");
        done();
      });
  });
  it("It should unMark current proj from fav list", done => {
    let req = {
      user: {
        email: "admin@pfizer.com",
        name: "Admin Pfizer 1",
        userId: "admin1"
      },
      project: _id
    };
    chai
      .request(server)
      .post("/api/unMarkFavorite")
      .send(req)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.have.property("status");
        res.body.status.should.have.property("code").eql(0);
        res.body.status.should.have.property("message");
        res.body.status.message.should.be.a("string");
        res.body.result.should.be.a("object");
        res.body.result.markedOn.should.be.a("string");
        res.body.result.project.should.be.a("string");
        res.body.result._id.should.be.a("string");
        done();
      });
  });
});
describe("Document", () => {
  describe('Upload documents for testing',()=>{
  it("Should upload file", done => {
    let req2 = {
      projectId: _pId,
      uploadedBy: {
        email: "tester1@pfizer.com",
        name: "Tester Pfizer 1",
        userId: "tester1"
      },
      fileType: "HA Guidelines"
    };
    chai
      .request(server)
      .post(
        "/api/labelling/upload?projectId=" +
          _pId +
          "&uploadedBy={%22email%22:%22tester1@pfizer.com%22,%22name%22:%22Tester%20Pfizer%201%22,%22userId%22:%22tester1%22}&fileType=HA%20Guidelines"
      )
      .field("name", "files")
      .attach(
        "files",
        currentProjPath +
          "/files_for_testing/0. HA - QRD-product-information-annotated-template-english-version-10_en.pdf"
      )
      .send(req2)

      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.have.property("status");
        res.body.status.should.have.property("code").eql(0);
        res.body.status.should.have.property("message");
        res.body.status.message.should.be.a("string");
        res.body.result.created_at.should.be.a("string");
        res.body.result.destination.should.be.a("string");
        res.body.result.documentName.should.be.a("string");
        res.body.result.documentid.should.be.a("string");
        res.body.result.fileType.should.be.a("string");
        res.body.result.location.should.be.a("string");
        res.body.result.mimetype.should.be.a("string");
        res.body.result.pdfPath.should.be.a("object");
        res.body.result.projectId.should.be.a("string");
        res.body.result.updated_at.should.be.a("string");
        res.body.result.uploadedDate.should.be.a("string");
        res.body.result._deleted.should.be.a("boolean").eql(false);
        res.body.result._id.should.be.a("string");
        _did = res.body.result._id;
        done();
      });
  });
  it("Should reUpload file", done => {
    let req2 = {
      projectId: _pId,
      uploadedBy: {
        email: "tester1@pfizer.com",
        name: "Tester Pfizer 1",
        userId: "tester1"
      },
      fileType: "Font Format Spec",
      documentId: _did
    };
    chai
      .request(server)
      .post(
        "/api/labelling/re-upload?projectId=" +
          _pId +
          "&uploadedBy={%22email%22:%22tester1@pfizer.com%22,%22name%22:%22Tester%20Pfizer%201%22,%22userId%22:%22tester1%22}&fileType=Font%20Format%20Spec&documentId=" +
          _did
      )
      .field("name", "files")
      .attach(
        "files",
        currentProjPath + "/files_for_testing/0. QRD format rules.pdf"
      )
      .send(req2)

      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.have.property("status");
        res.body.status.should.have.property("code").eql(0);
        res.body.status.should.have.property("message");
        res.body.status.message.should.be.a("string");
        res.body.result.created_at.should.be.a("string");
        res.body.result.destination.should.be.a("string");
        res.body.result.documentName.should.be.a("string");
        res.body.result.documentid.should.be.a("string");
        res.body.result.fileType.should.be.a("string");
        res.body.result.location.should.be.a("string");
        res.body.result.mimetype.should.be.a("string");
        res.body.result.pdfPath.should.be.a("object");
        res.body.result.projectId.should.be.a("string");
        res.body.result.updated_at.should.be.a("string");
        res.body.result.uploadedDate.should.be.a("string");
        res.body.result._deleted.should.be.a("boolean").eql(false);
        res.body.result._id.should.be.a("string");
        _rdid = res.body.result._id;
        done();
      });
  });
  it("Should delete document", done => {
    let req = {
      projectId: _pId,
      deletedBy: {
        email: "tester1@pfizer.com",
        name: "Tester Pfizer 1",
        userId: "tester1"
      },
      documentId: _rdid
    };

    chai
      .request(server)
      .post("/api/labelling/deleteDocument")
      .send(req)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.have.property("status");
        res.body.status.should.have.property("code").eql(0);
        res.body.status.should.have.property("message");
        res.body.status.message.should.be.a("string");
        res.body.result.should.be.a("object");
        res.body.result.deletedBy.should.be.a("object");
        res.body.result.documentId.should.be.a("string");
        res.body.result.projectId.should.be.a("string");
        done();
      });
  });
})
  describe("Upload documents for sanity", () => {
    it("It should upload label file", done => {
      let req2 = {
        projectId: _id,
        uploadedBy: {
          email: "tester1@pfizer.com",
          name: "Tester Pfizer 1",
          userId: "tester1"
        },
        fileType: "Label"
      };
      chai
        .request(server)
        .post(
          "/api/labelling/upload?projectId=" +
            _id +
            "&uploadedBy={%22email%22:%22tester1@pfizer.com%22,%22name%22:%22Tester%20Pfizer%201%22,%22userId%22:%22tester1%22}&fileType=Label"
        )
        .field("name", "files")
        .attach(
          "files",
          currentProjPath +
            "/files_for_testing/Saudi arabia_ Lorbrena_ 100 mg and 25 mg_ Tablets _LPD .docx"
        )
        .send(req2)

        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.property("status");
          res.body.status.should.have.property("code").eql(0);
          res.body.status.should.have.property("message");
          res.body.status.message.should.be.a("string");
          res.body.result.created_at.should.be.a("string");
          res.body.result.destination.should.be.a("string");
          res.body.result.documentName.should.be.a("string");
          res.body.result.documentid.should.be.a("string");
          res.body.result.fileType.should.be.a("string");
          res.body.result.location.should.be.a("string");
          res.body.result.mimetype.should.be.a("string");
          res.body.result.pdfPath.should.be.a("object");
          res.body.result.projectId.should.be.a("string");
          res.body.result.updated_at.should.be.a("string");
          res.body.result.uploadedDate.should.be.a("string");
          res.body.result._deleted.should.be.a("boolean").eql(false);
          res.body.result._id.should.be.a("string");
          sanity_labelfile_id = res.body.result._id;
          done();
        });
    });
    it("It should upload Reference file", done => {
      let req2 = {
        projectId: _id,
        uploadedBy: {
          email: "tester1@pfizer.com",
          name: "Tester Pfizer 1",
          userId: "tester1"
        },
        fileType: "Reference"
      };
      chai
        .request(server)
        .post(
          "/api/labelling/upload?projectId=" +
            _id +
            "&uploadedBy={%22email%22:%22tester1@pfizer.com%22,%22name%22:%22Tester%20Pfizer%201%22,%22userId%22:%22tester1%22}&fileType=Reference"
        )
        .field("name", "files")
        .attach(
          "files",
          currentProjPath +
            "/files_for_testing/USPI-LORBRENA-lorlatinib-tablets.docx"
        )
        .send(req2)

        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.property("status");
          res.body.status.should.have.property("code").eql(0);
          res.body.status.should.have.property("message");
          res.body.status.message.should.be.a("string");
          res.body.result.created_at.should.be.a("string");
          res.body.result.destination.should.be.a("string");
          res.body.result.documentName.should.be.a("string");
          res.body.result.documentid.should.be.a("string");
          res.body.result.fileType.should.be.a("string");
          res.body.result.location.should.be.a("string");
          res.body.result.mimetype.should.be.a("string");
          res.body.result.pdfPath.should.be.a("object");
          res.body.result.projectId.should.be.a("string");
          res.body.result.updated_at.should.be.a("string");
          res.body.result.uploadedDate.should.be.a("string");
          res.body.result._deleted.should.be.a("boolean").eql(false);
          res.body.result._id.should.be.a("string");
          done();
        });
    });
    it("It should upload HA Guidelines file", done => {
      let req2 = {
        projectId: _id,
        uploadedBy: {
          email: "tester1@pfizer.com",
          name: "Tester Pfizer 1",
          userId: "tester1"
        },
        fileType: "HA Guidelines"
      };
      chai
        .request(server)
        .post(
          "/api/labelling/upload?projectId=" +
            _id +
            "&uploadedBy={%22email%22:%22tester1@pfizer.com%22,%22name%22:%22Tester%20Pfizer%201%22,%22userId%22:%22tester1%22}&fileType=HA%20Guidelines"
        )
        .field("name", "files")
        .attach(
          "files",
          currentProjPath +
            "/files_for_testing/Saudi Reg TemplateSPC-PIL-Labeling.pdf"
        )
        .send(req2)

        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.property("status");
          res.body.status.should.have.property("code").eql(0);
          res.body.status.should.have.property("message");
          res.body.status.message.should.be.a("string");
          res.body.result.created_at.should.be.a("string");
          res.body.result.destination.should.be.a("string");
          res.body.result.documentName.should.be.a("string");
          res.body.result.documentid.should.be.a("string");
          res.body.result.fileType.should.be.a("string");
          res.body.result.location.should.be.a("string");
          res.body.result.mimetype.should.be.a("string");
          res.body.result.pdfPath.should.be.a("object");
          res.body.result.projectId.should.be.a("string");
          res.body.result.updated_at.should.be.a("string");
          res.body.result.uploadedDate.should.be.a("string");
          res.body.result._deleted.should.be.a("boolean").eql(false);
          res.body.result._id.should.be.a("string");

          done();
        });
    });
    it("It should upload Font Format Spec file", done => {
      let req2 = {
        projectId: _id,
        uploadedBy: {
          email: "tester1@pfizer.com",
          name: "Tester Pfizer 1",
          userId: "tester1"
        },
        fileType: "Font Format Spec"
      };
      chai
        .request(server)
        .post(
          "/api/labelling/upload?projectId=" +
            _id +
            "&uploadedBy={%22email%22:%22tester1@pfizer.com%22,%22name%22:%22Tester%20Pfizer%201%22,%22userId%22:%22tester1%22}&fileType=Font%20Format%20Spec"
        )
        .field("name", "files")
        .attach(
          "files",
          currentProjPath +
            "/files_for_testing/Saudi Reg TemplateSPC-PIL-Labeling.pdf"
        )
        .send(req2)

        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.property("status");
          res.body.status.should.have.property("code").eql(0);
          res.body.status.should.have.property("message");
          res.body.status.message.should.be.a("string");
          res.body.result.created_at.should.be.a("string");
          res.body.result.destination.should.be.a("string");
          res.body.result.documentName.should.be.a("string");
          res.body.result.documentid.should.be.a("string");
          res.body.result.fileType.should.be.a("string");
          res.body.result.location.should.be.a("string");
          res.body.result.mimetype.should.be.a("string");
          res.body.result.pdfPath.should.be.a("object");
          res.body.result.projectId.should.be.a("string");
          res.body.result.updated_at.should.be.a("string");
          res.body.result.uploadedDate.should.be.a("string");
          res.body.result._deleted.should.be.a("boolean").eql(false);
          res.body.result._id.should.be.a("string");
          done();
        });
    });
  });
});
describe("Rules Config", () => {
  var _r_id = "";
  it("It should create rules based config", done => {
    let req = {
      rulesSetup: { ruleName: "Formatting Phrase", ruleDescription: "TEST" },
      rulesApplication: {
        countryGroup: "",
        country: [
          {
            name: "Test Country",
            countryCode: "+27",
            flag: "../../assets/countryFlags/south_africa.gif"
          }
        ],
        global: false,
        sections: { value: ["test", "test2"], condition: "Exclude" },
        allSections: false
      },
      action: {
        conflictType: "Order",
        comments: "Test",
        modifyLabelOnAccept: true,
        allowReject: false
      },
      additionalInformation: {
        additionalInfo: true,
        addInfo: [
          { label: "Value", value: ["Test"] },
          { label: "Should be in", value: ["Lower"] }
        ]
      },
      exceptionData: ["Test"],
      createdBy: {
        email: "tester1@pfizer.com",
        name: "Tester Pfizer 1",
        userId: "tester1"
      }
    };

    chai
      .request(server)
      .post("/api/labelling/createRuleConfig")
      .send(req)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.have.property("status");
        res.body.status.should.have.property("code").eql(0);
        res.body.status.should.have.property("message");
        res.body.status.message.should.be.a("string");
        res.body.result.should.be.a("object");
        res.body.result.action.should.be.a("object");
        res.body.result.additionalInformation.should.be.a("object");
        res.body.result.createdBy.should.be.a("object");
        res.body.result.created_at.should.be.a("string");
        res.body.result.documents.should.be.a("array");
        res.body.result.exceptionData.should.be.a("array");
        res.body.result.rulesApplication.should.be.a("object");
        res.body.result.rulesSetup.should.be.a("object");
        res.body.result._id.should.be.a("string");
        _r_id = res.body.result._id;
        done();
      });
  });
  it("Should upload file for rules config", done => {
    chai
      .request(server)
      .post(
        "/api/labelling/configFileUpload?projectId=" +
          _r_id +
          "&uploadedBy={%22email%22:%22tester1@pfizer.com%22,%22name%22:%22Tester%20Pfizer%201%22,%22userId%22:%22tester1%22}&fileType=Reference"
      )
      .field("name", "files")
      .attach(
        "files",
        currentProjPath +
          "/files_for_testing/1. Ref - OrthoCyclen Aug 2017.docx"
      )
      .send()
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.have.property("status");
        res.body.status.should.have.property("code").eql(0);
        res.body.status.should.have.property("message");
        res.body.status.message.should.be.a("string");
        res.body.result.created_at.should.be.a("string");
        res.body.result.destination.should.be.a("string");
        res.body.result.documentName.should.be.a("string");
        res.body.result.documentid.should.be.a("string");
        res.body.result.fileType.should.be.a("string");
        res.body.result.location.should.be.a("string");
        res.body.result.updated_at.should.be.a("string");
        res.body.result.uploadedDate.should.be.a("string");
        res.body.result._deleted.should.be.a("boolean").eql(false);
        res.body.result._id.should.be.a("string");
        done();
      });
  });
  it("It should delete rules", done => {
    let req = {
      configType: "Rule",
      _id: _r_id
    };
    chai
      .request(server)
      .post("/api/labelling/deleteConfig")
      .send(req)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.have.property("status");
        res.body.status.should.have.property("code").eql(0);
        res.body.status.should.have.property("message");
        res.body.status.message.should.be.a("string");
        res.body.result.should.be.a("object");
        res.body.result.configType.should.be.a("string").eql("Rule");
        res.body.result._id.should.be.a("string");
        done();
      });
  });
});
describe("Country Config", () => {
  var _r_id = "";
  it("It should create country config based rules", done => {
    let req = {
      country: [
        {
          name: "Bosnia",
          countryCode: "+387",
          flag: "../../assets/countryFlags/bosnia_and_herzegovina.gif"
        }
      ],
      countryGrouping: "NA",
      languagePreference: "English (US)",
      createdBy: {
        email: "tester1@pfizer.com",
        name: "Tester Pfizer 1",
        userId: "tester1"
      }
    };
    chai
      .request(server)
      .post("/api/labelling/createCountryConfig")
      .send(req)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.have.property("status");
        res.body.status.should.have.property("code").eql(0);
        res.body.status.should.have.property("message");
        res.body.status.message.should.be.a("string");
        res.body.result.should.be.a("object");
        res.body.result.country.should.be.a("array");
        res.body.result.countryGrouping.should.be.a("string");
        res.body.result.createdBy.should.be.a("object");
        res.body.result.created_at.should.be.a("string");
        res.body.result.documents.should.be.a("array");
        res.body.result.languagePreference.should.be.a("string");
        _r_id = res.body.result._id;
        done();
      });
  });
  it("It should delete country config", done => {
    let req = {
      configType: "Country",
      _id: _r_id
    };
    chai
      .request(server)
      .post("/api/labelling/deleteConfig")
      .send(req)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.have.property("status");
        res.body.status.should.have.property("code").eql(0);
        res.body.status.should.have.property("message");
        res.body.status.message.should.be.a("string");
        res.body.result.should.be.a("object");
        res.body.result.configType.should.be.a("string").eql("Country");
        res.body.result._id.should.be.a("string");
        done();
      });
  });
});
/*  describe('Review Label',()=>{
    it('It should generate conflicts',(done)=>{
    
        let req = {
            _id:_id
        }
         chai
           .request(server)
           .post("/api/labelling/compare")
           .send(req)
           .end((err, res) => {
             res.should.have.status(200);
             res.body.should.be.a("object");
             res.body.should.have.property("status");
             res.body.status.should.have.property("code").eql(0);
             res.body.status.should.have.property("message");
             res.body.status.message.should.be.a("string");
             res.body.result.should.be.a("object");
             res.body.result.project.should.be.a("object");
             res.body.result.project.conflicts.should.be.a("object");
             res.body.result.project.conflicted.should.be.a("boolean").eql(true);
             res.body.result.project.documents.should.be.a("array");
             res.body.result.project._id.should.be.a("string");
             res.body.result.project.projectName.should.be.a("string");
             res.body.result.project.country.should.be.a("object");
             res.body.result.project.createdBy.should.be.a("object");
             //res.body.result.comments.should.be.a("array");
            // res.body.totalRecords.should.be.a("number");
             confComments = res.body.result.comments;

             confComments.forEach((data)=>{
                if(data.conflict_type=="Text Alignment"){
                    data.action="ACCEPT"
                    data._deleted=true
                    commentsToPass.push(data)
                }
             })
             console.log("commentsToPass")
            console.log(commentsToPass)
             done();
           });
    })
    
})
describe('Accept/Reject comments',()=>{
    it('It should accept/reject comments of type Content',(done)=>{
      console.log("***************** Inside Accept/reject *****************")
        console.log(commentsToPass)
        let req = {
          commentAction: { action: "accept/reject", type: "" },
          comments: commentsToPass,
          projectId:_id,
          user: {
            email: "tester1@pfizer.com",
            name: "Tester Pfizer 1",
            userId: "tester1"
          }
        };

         chai
           .request(server)
           .post("/api/labelling/commentAck")
           .send(req)
           .end((err, res) => {
             res.should.have.status(200);
             res.body.should.be.a("object");
             res.body.should.have.property("status");
             res.body.status.should.have.property("code").eql(0);
             res.body.status.should.have.property("message");
             res.body.status.message.should.be.a("string");
             res.body.result.should.be.a("object");
             res.body.result.project.should.be.a("object");
             res.body.result.project.conflicts.should.be.a("object");
             res.body.result.project.conflicted.should.be
               .a("boolean")
               .eql(true);
             res.body.result.project.documents.should.be.a("array");
             res.body.result.project._id.should.be.a("string");
             res.body.result.project.projectName.should.be.a("string");
             res.body.result.project.country.should.be.a("object");
             res.body.result.project.createdBy.should.be.a("object");
             res.body.result.comments.should.be.a("array");
             res.body.totalRecords.should.be.a("number");
             done();
           });
    })
}) 
describe('View conflicts', () => {
    it('Should get conflicts data', (done) => {
        let req = {
            _id: _id
        }
        chai.request(server)
            .post('/api/labelling/viewConflictProject')
            .send(req)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('status');
                res.body.status.should.have.property('code').eql(0);
                res.body.status.should.have.property('message');
                res.body.status.message.should.be.a('string');
                res.body.result.should.be.a('object');
                res.body.result.project.should.be.a('object');
                res.body.result.project.conflicts.should.be.a('object');
                res.body.result.project.conflicted.should.be.a('boolean');
                res.body.result.project.documents.should.be.a('array');
                res.body.result.project._id.should.be.a('string');
                res.body.result.project.projectName.should.be.a('string');
                res.body.result.project.country.should.be.a('object');
                res.body.result.project.createdBy.should.be.a('object');
                res.body.result.comments.should.be.a('array');
                res.body.totalRecords.should.be.a('number');
                done()
            })
    })
})
describe("Generate mapping spec", () => {
  it("Should generate mapping spec", done => {
    let req = {
      _id: _id
    };
    chai
      .request(server)
      .post("/api/labelling/getMappingSpec")
      .send(req)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.have.property("status");
        res.body.status.should.have.property("code").eql(0);
        res.body.status.should.have.property("message");
        res.body.status.message.should.be.a("string");
        res.body.result.should.be.a("array");
        res.body.result.should.not.be.empty;
        done();
      });
  });
}); */

describe('QC Report',()=>{

  it('It should get checkList data',(done)=>{
    let req = {
      project_id: _id,
      file_id: sanity_labelfile_id,
      user: {
        email: "tester1@pfizer.com",
        name: "Tester Pfizer 1",
        userId: "tester1"
      } 
    };
    chai.request(server).post("/api/checkList").send(req)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.have.property("status");
        res.body.status.should.have.property("code").eql(0);
        res.body.status.should.have.property("message");
        res.body.status.message.should.be.a("string");
        res.body.result.should.be.a("array");
        res.body.result.checks.should.be.a("array");
        res.body.result.file_id.should.be.a("string");
        res.body.result.project_id.should.be.a("string");
        done();
      });

  })
})

describe("Get dashboard", () => {
  it("Should get all dashboard data", done => {
    let req = {
      email: "admin@pfizer.com",
      name: "Admin Pfizer 1",
      userId: "admin1"
    };
    chai
      .request(server)
      .post("/api/labelling/dashboard")
      .send(req)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.have.property("status");
        res.body.status.should.have.property("code").eql(0);
        res.body.status.should.have.property("message");
        res.body.status.message.should.be.a("string");
        res.body.result.conflict.should.be.a("number");
        res.body.result.conflictTypeCount.should.be.a("array");
        res.body.result.documentsCount.should.be.a("number");
        res.body.result.documentsTypeCount.should.be.a("array");
        res.body.result.favouritesCount.should.be.a("number");
        res.body.result.lastConflictCreated.should.be.a("string");
        res.body.result.lastUploadedDocumentDate.should.be.a("string");
        res.body.result.projectCount.should.be.a("number");
        res.body.result.totalConflictsCount.should.be.a("number");
        done();
      });
  });
});
describe("Audit/History", () => {
  it("It should get Audit/Hostory based on project ID", done => {
    let req = {
        "project._id": _id}
    chai
      .request(server)
      .post("/api/labelling/auditHistory")
      .send(req)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.have.property("status");
        res.body.status.should.have.property("code").eql(0);
        res.body.status.should.have.property("message");
        res.body.status.message.should.be.a("string");
        res.body.result.should.be.a("array");
        console.log(res.body)
        done();
      });
  });
  
});



