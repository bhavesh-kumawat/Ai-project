const jwt = require(`jsonwebtoken`);
const { jwtSecret, jwtExpiresIn } = require(`../config/auth.config`);

exports.login = async (req, res) => {
    const user = await User.findOne({ email : req.body.email });

    if(!user) {
        return res.status(404).send({ message: "User Not found." });
    }

     const token = jwt.sign(
    {
      userId: user._id,
      role: user.role
    },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );

  res.json({ token });

}