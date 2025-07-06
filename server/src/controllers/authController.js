const { prisma } = require('../config/database')
const { hashPassword, comparePassword, generateToken } = require('../utils/auth')

// Register new user
const register = async (req, res) => {
  try {
    const { username, email, password, roleId, ...additionalData } = req.body

    // Validation
    if (!username || !email || !password || !roleId) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, password, and roleId are required'
      })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      }
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email.toLowerCase() 
          ? 'Email already registered' 
          : 'Username already taken'
      })
    }

    // Validate role exists by ID
    const roleRecord = await prisma.role.findUnique({
      where: { id: parseInt(roleId) }
    })

    if (!roleRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role selected'
      })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword,
        roleId: parseInt(roleId),
        ...additionalData
      },
      include: {
        role: true
      }
    })

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      roleId: user.roleId
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userWithoutPassword,
      token,
      needsProfileCompletion: !user.phoneNumber || !user.birthDate || !user.postcode || !user.gender
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    })
  }
}

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        role: true
      }
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      roleId: user.roleId
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
      token,
      needsProfileCompletion: !user.phoneNumber || !user.birthDate || !user.postcode || !user.gender
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    })
  }
}

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        role: true
      }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    res.status(200).json({
      success: true,
      data: userWithoutPassword
    })

  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { username, phoneNumber, birthDate, postcode, gender, profileImage } = req.body
    const userId = req.user.id

    // Check if username is taken by another user
    if (username && username !== req.user.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: username.toLowerCase(),
          id: { not: userId }
        }
      })

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        })
      }
    }

    // Prepare update data
    const updateData = {}
    if (username) updateData.username = username.toLowerCase()
    if (phoneNumber) updateData.phoneNumber = phoneNumber
    if (birthDate) updateData.birthDate = new Date(birthDate)
    if (postcode) updateData.postcode = postcode
    if (gender) updateData.gender = gender
    if (profileImage) updateData.profilePicture = profileImage // Store as profilePicture in DB

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        role: true
      }
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error during profile update'
    })
  }
}

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user.id

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      })
    }

    // Get user with current password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password)
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      })
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword)

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    })

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    })

  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error during password change'
    })
  }
}

// Get all roles
const getRoles = async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { id: 'asc' }
    })

    res.status(200).json({
      success: true,
      data: roles
    })

  } catch (error) {
    console.error('Get roles error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

// Logout (client-side token removal, but we can track this server-side later)
const logout = async (req, res) => {
  try {
    // For now, logout is handled client-side by removing the token
    // In the future, you might want to implement token blacklisting
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    })

  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout'
    })
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getRoles,
  logout
}
