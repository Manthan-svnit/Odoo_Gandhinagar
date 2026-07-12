import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) throw new Error('MONGODB_URI missing in .env.local');

const UserSchema = new mongoose.Schema({ name: String, email: String, password: String, role: String }, { timestamps: true });
const VehicleSchema = new mongoose.Schema({ registrationNumber: String, name: String, model: String, type: String, maxLoadCapacity: Number, odometer: Number, acquisitionCost: Number, status: { type: String, default: 'Available' } }, { timestamps: true });
const DriverSchema = new mongoose.Schema({ name: String, licenseNumber: String, licenseCategory: String, licenseExpiryDate: Date, contactNumber: String, email: String, safetyScore: Number, tripsCompleted: Number, status: { type: String, default: 'Available' } }, { timestamps: true });
const TripSchema = new mongoose.Schema({ tripNumber: String, source: String, destination: String, vehicleId: mongoose.Schema.Types.ObjectId, driverId: mongoose.Schema.Types.ObjectId, cargoWeight: Number, plannedDistance: Number, actualDistance: Number, fuelConsumed: Number, revenue: Number, status: { type: String, default: 'Draft' }, dispatchedAt: Date, completedAt: Date }, { timestamps: true });
const MaintenanceSchema = new mongoose.Schema({ vehicleId: mongoose.Schema.Types.ObjectId, serviceType: String, description: String, cost: Number, date: Date, status: { type: String, default: 'Active' }, closedAt: Date }, { timestamps: true });
const FuelSchema = new mongoose.Schema({ vehicleId: mongoose.Schema.Types.ObjectId, tripId: mongoose.Schema.Types.ObjectId, liters: Number, costPerLiter: Number, totalCost: Number, date: Date, odometer: Number }, { timestamps: true });
const ExpenseSchema = new mongoose.Schema({ vehicleId: mongoose.Schema.Types.ObjectId, tripId: mongoose.Schema.Types.ObjectId, category: String, amount: Number, description: String, date: Date }, { timestamps: true });
const SettingsSchema = new mongoose.Schema({ depotName: String, currency: String, distanceUnit: String }, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);
const Driver = mongoose.models.Driver || mongoose.model('Driver', DriverSchema);
const Trip = mongoose.models.Trip || mongoose.model('Trip', TripSchema);
const Maintenance = mongoose.models.MaintenanceLog || mongoose.model('MaintenanceLog', MaintenanceSchema);
const FuelLog = mongoose.models.FuelLog || mongoose.model('FuelLog', FuelSchema);
const Expense = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  await Promise.all([User, Vehicle, Driver, Trip, Maintenance, FuelLog, Expense, Settings].map(m => m.deleteMany({})));
  console.log('Cleared existing data');

  const hash = (p: string) => bcrypt.hash(p, 10);

  const users = await User.insertMany([
    { name: 'Raven Kumar', email: 'admin@transitops.in', password: await hash('admin123'), role: 'fleet_manager' },
    { name: 'Priya Shah', email: 'dispatcher@transitops.in', password: await hash('demo123'), role: 'dispatcher' },
    { name: 'Suresh Mehta', email: 'safety@transitops.in', password: await hash('demo123'), role: 'safety_officer' },
    { name: 'Anjali Patel', email: 'finance@transitops.in', password: await hash('demo123'), role: 'financial_analyst' },
  ]);
  console.log('Users seeded:', users.length);

  const vehicles = await Vehicle.insertMany([
    { registrationNumber: 'GJ01AB452', name: 'VAN-05', model: 'Eeco', type: 'Van', maxLoadCapacity: 500, odometer: 74000, acquisitionCost: 620000, status: 'Available' },
    { registrationNumber: 'GJ01AB998', name: 'TRUCK-11', model: 'Tata 407', type: 'Truck', maxLoadCapacity: 5000, odometer: 182000, acquisitionCost: 2450000, status: 'On Trip' },
    { registrationNumber: 'GJ01AB120', name: 'MINI-03', model: 'Force Traveller', type: 'Mini', maxLoadCapacity: 1000, odometer: 66000, acquisitionCost: 410000, status: 'In Shop' },
    { registrationNumber: 'GJ01AB008', name: 'VAN-09', model: 'Mahindra Supro', type: 'Van', maxLoadCapacity: 750, odometer: 241900, acquisitionCost: 590000, status: 'Retired' },
    { registrationNumber: 'GJ01CD234', name: 'TRUCK-04', model: 'Ashok Leyland', type: 'Truck', maxLoadCapacity: 8000, odometer: 95000, acquisitionCost: 3200000, status: 'Available' },
    { registrationNumber: 'GJ01EF567', name: 'VAN-12', model: 'Maruti Omni', type: 'Van', maxLoadCapacity: 400, odometer: 120000, acquisitionCost: 380000, status: 'Available' },
  ]);
  console.log('Vehicles seeded:', vehicles.length);

  const now = new Date();
  const future = (months: number) => new Date(now.getFullYear(), now.getMonth() + months, now.getDate());
  const past = (months: number) => new Date(now.getFullYear(), now.getMonth() - months, now.getDate());

  const drivers = await Driver.insertMany([
    { name: 'Alex Rathod', licenseNumber: 'DL-8813', licenseCategory: 'LMV', licenseExpiryDate: future(18), contactNumber: '98765xxxxx', email: 'alex@example.com', safetyScore: 96, tripsCompleted: 42, status: 'Available' },
    { name: 'John Desai', licenseNumber: 'DL-44120', licenseCategory: 'HMV', licenseExpiryDate: past(1), contactNumber: '98220xxxxx', email: 'john@example.com', safetyScore: 81, tripsCompleted: 38, status: 'Suspended' },
    { name: 'Priya Joshi', licenseNumber: 'DL-77031', licenseCategory: 'LMV', licenseExpiryDate: future(6), contactNumber: '99110xxxxx', email: 'priya@example.com', safetyScore: 99, tripsCompleted: 61, status: 'On Trip' },
    { name: 'Suresh Nair', licenseNumber: 'DL-90045', licenseCategory: 'HMV', licenseExpiryDate: future(24), contactNumber: '97440xxxxx', email: 'suresh@example.com', safetyScore: 88, tripsCompleted: 29, status: 'Available' },
    { name: 'Mohit Sharma', licenseNumber: 'DL-55678', licenseCategory: 'HGMV', licenseExpiryDate: future(12), contactNumber: '96330xxxxx', email: 'mohit@example.com', safetyScore: 92, tripsCompleted: 15, status: 'Available' },
  ]);
  console.log('Drivers seeded:', drivers.length);

  const trips = await Trip.insertMany([
    { tripNumber: 'TR001', source: 'Gandhinagar Depot', destination: 'Ahmedabad Hub', vehicleId: vehicles[1]._id, driverId: drivers[2]._id, cargoWeight: 450, plannedDistance: 38, actualDistance: 40, fuelConsumed: 6.5, revenue: 8500, status: 'Dispatched', dispatchedAt: past(0) },
    { tripNumber: 'TR002', source: 'Vatva Industrial Area', destination: 'Sanand Warehouse', vehicleId: vehicles[4]._id, driverId: drivers[3]._id, cargoWeight: 3200, plannedDistance: 25, actualDistance: 27, fuelConsumed: 9, revenue: 18000, status: 'Completed', dispatchedAt: past(0), completedAt: past(0) },
    { tripNumber: 'TR003', source: 'Mansa', destination: 'Kalol Depot', vehicleId: vehicles[0]._id, driverId: drivers[0]._id, cargoWeight: 200, plannedDistance: 15, status: 'Cancelled' },
    { tripNumber: 'TR004', source: 'Surat', destination: 'Gandhinagar', vehicleId: vehicles[5]._id, driverId: drivers[4]._id, cargoWeight: 350, plannedDistance: 270, status: 'Draft' },
  ]);
  console.log('Trips seeded:', trips.length);

  await Maintenance.insertMany([
    { vehicleId: vehicles[2]._id, serviceType: 'Oil Change', description: 'Regular oil change', cost: 2500, date: past(0), status: 'Active' },
    { vehicleId: vehicles[1]._id, serviceType: 'Engine Repair', description: 'Turbocharger replacement', cost: 18000, date: past(1), status: 'Closed', closedAt: past(0) },
    { vehicleId: vehicles[0]._id, serviceType: 'Tyre Replace', description: 'All 4 tyres changed', cost: 6200, date: past(0), status: 'Active' },
  ]);
  console.log('Maintenance records seeded');

  await FuelLog.insertMany([
    { vehicleId: vehicles[0]._id, tripId: trips[0]._id, liters: 42, costPerLiter: 75, totalCost: 3150, date: new Date('2026-07-05'), odometer: 74042 },
    { vehicleId: vehicles[1]._id, tripId: trips[1]._id, liters: 110, costPerLiter: 76.36, totalCost: 8400, date: new Date('2026-07-06'), odometer: 182110 },
    { vehicleId: vehicles[2]._id, liters: 28, costPerLiter: 73.21, totalCost: 2050, date: new Date('2026-07-06'), odometer: 66028 },
  ]);
  console.log('Fuel logs seeded');

  await Expense.insertMany([
    { vehicleId: vehicles[0]._id, tripId: trips[0]._id, category: 'Toll', amount: 120, description: 'Highway toll', date: new Date('2026-07-05') },
    { vehicleId: vehicles[1]._id, tripId: trips[1]._id, category: 'Toll', amount: 340, description: 'Multi-point tolls', date: new Date('2026-07-06') },
    { vehicleId: vehicles[1]._id, category: 'Maintenance', amount: 18000, description: 'Engine repair linked', date: new Date('2026-07-01') },
    { vehicleId: vehicles[2]._id, tripId: trips[1]._id, category: 'Other', amount: 150, description: 'Driver allowance', date: new Date('2026-07-06') },
  ]);
  console.log('Expenses seeded');

  await Settings.create({ depotName: 'Gandhinagar Depot GJ4', currency: 'INR (₹)', distanceUnit: 'Kilometers' });
  console.log('Settings seeded');

  console.log('\n=== SEED COMPLETE ===');
  console.log('Login credentials:');
  console.log('  Fleet Manager  : admin@transitops.in / admin123');
  console.log('  Dispatcher     : dispatcher@transitops.in / demo123');
  console.log('  Safety Officer : safety@transitops.in / demo123');
  console.log('  Fin. Analyst   : finance@transitops.in / demo123');

  await mongoose.disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
