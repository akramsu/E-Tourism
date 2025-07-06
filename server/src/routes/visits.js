const express = require('express')
const router = express.Router()

// Placeholder visits routes
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Visits endpoint working',
    data: []
  })
})

module.exports = router
