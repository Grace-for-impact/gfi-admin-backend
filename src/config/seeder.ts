import User from '../models/User';

const seedAdmin = async () => {
  try {
    const adminEmail = 'franklinkenneth999@gmail.com';
    const adminPassword = '@Admin001';

    const userExists = await User.findOne({ email: adminEmail.toLowerCase() });

    if (!userExists) {
      await User.create({
        fullName: 'Grace For Impact HR',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });
      console.log('Admin user seeded successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error: any) {
    console.error(`Error seeding admin user: ${error.message}`);
  }
};

export default seedAdmin;
