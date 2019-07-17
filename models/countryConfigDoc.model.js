var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var CountryConfigDocSchema = new Schema(
  [
    {
      countryConfig_id:String,
      documentName: {
        type: String,
        required: true
      },
      documentid: {
        type: String,
        required: true,
        unique: true
      },
      destination: {
        type: String
      },
      fileType: {
        type: String
      },
      uploadedBy: {
        type: Object
      },
      uploadedDate: {
        type:Date,  
        default: new Date()
      },
      location: {
        type: String
      },
      _deleted: {
        type: Boolean,
        default: false
      }
    }
  ],
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

module.exports = mongoose.model("CountryConfigDocSchema", CountryConfigDocSchema);
