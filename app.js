const express = require('express');
const cors = require('cors'); // Import the cors module
const fs = require('fs').promises; // Import functions for interacting with the file system.
const app = express();
const port = 3000;

// enabling Cross-Origin Resource Sharing (CORS) for the Express application.
app.use(cors());
app.use(express.json());

//These variables are used to store the data read from JSON files.
let parentData, childData;

// Async function to read data from JSON files
async function readData() {
  try {
    parentData = JSON.parse(await fs.readFile('Parent.json'));
    childData = JSON.parse(await fs.readFile('Child.json'));
  } catch (err) {
    console.error('Error reading JSON files:', err);
  }
}

// Initialize data by calling readData at startup
readData();


// API endpoint to fetch parent transactions with pagination and sorting
app.get('/api/parent', (req, res) => {
  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 2;

  if (!parentData) {
    return res.status(500).json({ error: 'Data not available' });
  }
  
  // Sorting parameter
  const sortBy = req.query.sortBy || 'id'; // Default to sorting by 'id'

  // Sort the parentData by the specified field
  const sortedData = parentData.data.slice().sort((a, b) => a[sortBy] - b[sortBy]);


  // Calculate the start and end indexes for pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = page * pageSize;


  // Get the paginated parent data and Calculate the Total Paid Amount for each parent transaction
  const paginatedData = sortedData.slice(startIndex, endIndex).map((parent) => {
    const totalPaidAmount = childData.data
      .filter((child) => child.parentId === parent.id)
      .reduce((total, child) => total + child.paidAmount, 0);

    return {
      ...parent, // The `...` is using the spread syntax in JavaScript. It is used to create a shallow copy of the `parent` object.
      totalPaidAmount, // In this case, it is used to add the `totalPaidAmount` property to the copied `parent` object before returning it as part of the response.
    };
  });

/* Sending a JSON response from the server to the client. */
  res.json({ 
    data: paginatedData, // key-value pair in an object. The key is "data" and the value is the `paginatedData` variable.
    totalPages: Math.ceil(parentData.data.length / pageSize), //calculating the total number of pages for pagination.
    currentPage: page, //adding a key-value pair to the JSON response sent from the server to the client
  });
});

// API endpoint to fetch child data for a specific parent transaction
app.get('/api/child/:parentId', (req, res) => {
  const parentId = parseInt(req.params.parentId);
  // filtering the `childData` array to only include child objects that have a `parentId` matching the `parentId` parameter passed in the request URL.
  const filteredChildData = childData.data.filter((child) => child.parentId === parentId);

  if (!childData) {
    return res.status(500).json({ error: 'Data not available' });
  }

  res.json(filteredChildData);
});

// Starting the server and listening for incoming requests on the specified port.
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
