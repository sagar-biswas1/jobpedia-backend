

require("dotenv").config();
const express = require("express");
const app = express();
const port = 4000;
const cors = require("cors");
const ObjectId = require("mongodb").ObjectId;

app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
require("dotenv").config();
app.get("/", (req, res) => {
  res.send("Hello World!");
});

const MongoClient = require("mongodb").MongoClient;
const uri =
  `mongodb+srv://sagar:${process.env.DB_PASS}@cluster0.lbdfe.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const jobCollection = client.db("jobpedia").collection("jobs");
  const userCollection = client.db("jobpedia").collection("users");
  const employerCollection = client.db("jobpedia").collection("employers");
  const adminCollection = client.db("jobpedia").collection("admin");
  //add user and employer to database

  app.post("/add-user", (req, res) => {
    const { email, role } = req.body;

    employerCollection.findOne({ email }).then((response) => {
      if (response) {
        return res.send({
          message:
            "there is already a employer with this email. Please go to login page and log in as employer",
          user: false,
        });
      }
      if (!response) {
        userCollection.findOne({ email }).then((response) => {
          if (response) {
            return res.send({
              message: "there is already a user with this email",
              user: true,
            });
          }
          if (!response) {
            userCollection
              .insertOne({
                email,
                role,
              })
              .then((result) => {
                res.send({
                  message: "user has been added to the db",
                  user: true,
                });
              });
          }
        });
      }
    });
  });
  // add employers
  app.post("/add-employer", (req, res) => {
    const { email } = req.body;
    employerCollection.findOne({ email }).then((response) => {
      if (response) {
        return res.send({
          message: "there is already a employer with this email",
        });
      }
      if (!response) {
        employerCollection
          .insertOne({
            ...req.body,
          })
          .then((result) => {
            res.send({ message: "employer has been added to the db" });
          });
      }
    });
  });
  // check for if the email has a role of employer
  app.get("/is-employer/:email", (req, res) => {
    employerCollection.findOne({ email: req.params.email }).then((result) => {
      if (result) {
        res.send({ role: result.role });
      } else {
        //res.send({role: null })
        userCollection.findOne({ email: req.params.email }).then((response) => {
          if (response) {
            return res.send({
              message: "there is already a user with this email",
              role: "user",
            });
          }
          if (!response) {
            userCollection
              .insertOne({
                email: req.params.email,
                role: "user",
              })
              .then((result) => {
                res.send({
                  message: "user has been added to the db",
                  role: "user",
                });
              });
          }
        });
      }
    });
  });
  //  see if a user is an admin or not based on email
  app.get("/is-admin/:email", (req, res) => {
    adminCollection.findOne({ email: req.params.email }).then((result) => {
      res.send({ isAdmin: result?.role === "admin" });
    });
  });

  //post a job
  app.post("/post-job", (req, res) => {
    jobCollection
      .insertOne({
        ...req.body,
        status: "pending",
      })
      .then((result) => {
        res.send({ message: "Job is pending for the approval.Thank you. " });
      });
  });
  //get job posted by employer
  app.get("/job-posted/:email", (req, res) => {
    const email = req.params.email;
    jobCollection
      .find({
        email,
      })
      .toArray((err, document) => {
        res.send(document);
      });
  });

  // all-jobs posted
  app.get("/all-job-posted/", (req, res) => {
    jobCollection.find().toArray((err, document) => {
      res.send(document);
    });
  });
  // jobs that are approved
  app.get("/all-jobs-approved/", (req, res) => {
    const email = req.params.email;
    jobCollection.find({ status: "approved" }).toArray((err, document) => {
      res.send(document);
    });
  });

  // update job status
  app.patch("/update-job-status/:jobId", (req, res) => {
    const id = req.params.jobId;

    const status = req.body.status;

    jobCollection
      .updateOne(
        { _id: ObjectId(id) },
        {
          $set: {
            status,
          },
        }
      )
      .then((result) => {
        res.send({
          message: "job status updated successfully",
          modified: result.modifiedCount > 0,
        });
      });
  });

  //search for jobs
  app.get("/search-jobs/:query", (req, res) => {
    const query = new RegExp(`^${req.params.query}`, "i");

    jobCollection
      .find({ jobTitle: { $regex: query } })
      .toArray((err, document) => {
        res.send(document);
      });
  });
});


app.get('/',(req,res)=>{
  res.send('hello world')
})


app.listen(process.env.PORT ||port, () => {});
