var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PreferenceSchema = new Schema(
  [
    {
      ruleName: {
        type: String
      },
      action: {
        type: String
      },
      details: [
        {
          description: [],
          country: [],
          scope: String,
          descriptionId: Number,
          createdBy: {},
          createdOn: {
            type: Date,
            default: new Date()
          }
          
        }
      ]
    }
  ],
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

module.exports = mongoose.model('Preference', PreferenceSchema);
