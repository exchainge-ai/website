/**
 * Seed script to populate database with sample datasets
 * Run with: bun run scripts/seed-datasets.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sampleDatasets = [
  {
    title: "Boston Dynamics Spot Warehouse Navigation",
    description: "6 months of real warehouse navigation data from Spot quadruped robot. Includes 850K LiDAR scans, 1.2M camera frames, IMU at 200Hz. Collision recovery sequences, narrow aisle traversal, human interaction scenarios, and edge cases from production deployment.",
    price_usd: "2499",
    category: "robotics",
    size_bytes: 487 * 1024 * 1024 * 1024, // 487 GB
    size_formatted: "487 GB",
    file_format: "ROS2 Bag, MCAP",
    tags: ["warehouse", "spot-robot", "navigation", "lidar", "collision-recovery", "real-hardware"],
    thumbnail_url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop",
    verification_score: 98,
    status: "live",
  },
  {
    title: "Tesla Autopilot Urban Driving Dataset",
    description: "500K miles of Tesla Model 3 autopilot logs from San Francisco streets. 8-camera setup with 1.3M frames each, 4D radar data, GPS/IMU fusion. Includes challenging scenarios: rain, night driving, construction zones, double-parked cars, jaywalkers, and emergency vehicles.",
    price_usd: "4999",
    category: "autonomous_vehicles",
    size_bytes: Math.floor(2.1 * 1024 * 1024 * 1024 * 1024), // 2.1 TB
    size_formatted: "2.1 TB",
    file_format: "HDF5, MP4, Protobuf",
    tags: ["autopilot", "urban-driving", "edge-cases", "8-camera", "radar", "tesla"],
    thumbnail_url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop",
    verification_score: 99,
    status: "live",
  },
  {
    title: "Commercial Drone Package Delivery Fleet",
    description: "12K real delivery flights from DJI Matrice commercial operations. Complete flight logs with GPS trajectories, battery drain curves, wind resistance data, landing precision metrics. Includes failure modes: emergency landings, obstacle avoidance events, and GPS dropout recovery.",
    price_usd: "1899",
    category: "navigation",
    size_bytes: 156 * 1024 * 1024 * 1024, // 156 GB
    size_formatted: "156 GB",
    file_format: "Flight Logs, CSV, MP4",
    tags: ["drone-delivery", "flight-logs", "failures", "wind", "battery", "landing"],
    thumbnail_url: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=300&fit=crop",
    verification_score: 96,
    status: "live",
  },
  {
    title: "Franka Panda Robotic Grasping Dataset",
    description: "50K real grasping attempts with tactile and vision feedback. RGB-D camera frames, 16-channel tactile sensor readings, joint torques, success/failure labels. Objects include household items, tools, and fragile items. Grasp failures and slip detection events included for robust learning.",
    price_usd: "1599",
    category: "manipulation",
    size_bytes: 203 * 1024 * 1024 * 1024, // 203 GB
    size_formatted: "203 GB",
    file_format: "ROS Bag, HDF5, JSON",
    tags: ["grasping", "tactile", "franka-panda", "manipulation", "slip-detection", "rgb-d"],
    thumbnail_url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=300&fit=crop",
    verification_score: 97,
    status: "live",
  },
  {
    title: "Industrial Safety Multi-Camera Monitoring",
    description: "200 days of factory floor safety monitoring from 12 synchronized cameras. Human-robot proximity events, near-miss incidents, PPE detection labels, anonymized worker tracking. Dataset used by 3 Fortune 500 manufacturers for safety AI training and compliance.",
    price_usd: "3299",
    category: "human_robot_interaction",
    size_bytes: Math.floor(1.8 * 1024 * 1024 * 1024 * 1024), // 1.8 TB
    size_formatted: "1.8 TB",
    file_format: "MP4, JSON Labels",
    tags: ["safety", "factory", "proximity-detection", "ppe", "multi-camera", "industrial"],
    thumbnail_url: "https://images.unsplash.com/photo-1527430253228-e93688616381?w=400&h=300&fit=crop",
    verification_score: 95,
    status: "live",
  },
  {
    title: "Home Robot Vacuum Long-Term Navigation",
    description: "2.5 years of continuous Roomba-style vacuum operation across 5M homes. Floor plans, obstacle maps, furniture layouts, pet interactions, carpet vs hardwood detection. Anonymized data from diverse residential environments. Perfect for home robotics and SLAM research.",
    price_usd: "899",
    category: "navigation",
    size_bytes: 87 * 1024 * 1024 * 1024, // 87 GB
    size_formatted: "87 GB",
    file_format: "SQLite, Binary Logs",
    tags: ["home-robotics", "floor-mapping", "obstacles", "pet-detection", "lidar", "long-term"],
    thumbnail_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    verification_score: 93,
    status: "live",
  },
  {
    title: "Da Vinci Surgical Robot Telemetry",
    description: "500 anonymized laparoscopic surgical procedures from da Vinci surgical system. Instrument positions, force feedback, stereo camera feeds, surgeon input commands. IRB-approved and HIPAA-compliant. Used in 4 peer-reviewed medical robotics research papers.",
    price_usd: "9999",
    category: "manipulation",
    size_bytes: 412 * 1024 * 1024 * 1024, // 412 GB
    size_formatted: "412 GB",
    file_format: "Proprietary + CSV",
    tags: ["surgical", "medical", "da-vinci", "force-feedback", "stereo-vision", "hipaa"],
    thumbnail_url: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=400&h=300&fit=crop",
    verification_score: 99,
    status: "live",
  },
  {
    title: "Sidewalk Delivery Robot Operations",
    description: "100K miles of last-mile delivery robot data from urban sidewalks. Pedestrian interactions, crosswalk navigation, curb climbing sequences, theft attempt logs, weather conditions including rain and snow. Real food delivery operations with GPS tracks and sensor logs.",
    price_usd: "2899",
    category: "autonomous_vehicles",
    size_bytes: 623 * 1024 * 1024 * 1024, // 623 GB
    size_formatted: "623 GB",
    file_format: "ROS Bag, MP4, KML",
    tags: ["delivery-robot", "pedestrian", "curb-climbing", "weather", "theft", "sidewalk"],
    thumbnail_url: "https://images.unsplash.com/photo-1563207153-f403bf289096?w=400&h=300&fit=crop",
    verification_score: 96,
    status: "live",
  },
  {
    title: "Warehouse AMR Fleet Coordination",
    description: "1 year of multi-robot warehouse operations with 50 autonomous mobile robots. Fleet coordination logs, traffic management, charging schedules, task allocation. Includes system failures: path conflicts, dead batteries, sensor malfunctions. Complete production deployment data.",
    price_usd: "5499",
    category: "robotics",
    size_bytes: Math.floor(1.2 * 1024 * 1024 * 1024 * 1024), // 1.2 TB
    size_formatted: "1.2 TB",
    file_format: "PostgreSQL, ROS Logs",
    tags: ["fleet-management", "multi-robot", "warehouse", "coordination", "failures", "amr"],
    thumbnail_url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop",
    verification_score: 98,
    status: "live",
  },
  {
    title: "Atlas Humanoid Bipedal Locomotion",
    description: "10K hours of full-body humanoid walking and running. 28 DOF joint angles, foot pressure sensors, IMU fusion data, recovery from external pushes and slips. Terrain includes stairs, slopes, uneven ground, obstacles. Spectacular fall and recovery sequences included.",
    price_usd: "7999",
    category: "robotics",
    size_bytes: 856 * 1024 * 1024 * 1024, // 856 GB
    size_formatted: "856 GB",
    file_format: "HDF5, C3D, Video",
    tags: ["humanoid", "bipedal", "locomotion", "atlas", "falls", "recovery"],
    thumbnail_url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop",
    verification_score: 99,
    status: "live",
  },
  {
    title: "Agricultural Robot Crop Monitoring",
    description: "500 acres of farming robot data across full growing season. RGB and multispectral imaging for crop health detection, weed identification, harvest yield predictions, soil moisture readings. GPS-tagged data with seasonal variations and pest outbreak response logs.",
    price_usd: "1299",
    category: "sensor_data",
    size_bytes: 234 * 1024 * 1024 * 1024, // 234 GB
    size_formatted: "234 GB",
    file_format: "TIFF, Shapefiles, CSV",
    tags: ["agriculture", "crop-monitoring", "multispectral", "harvest", "soil", "farming"],
    thumbnail_url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=300&fit=crop",
    verification_score: 94,
    status: "live",
  },
  {
    title: "ANYmal Quadruped Mountain Terrain",
    description: "200 hours of outdoor quadruped locomotion on mountain trails. Rough terrain navigation including mud, rocks, water crossings, steep inclines. Proprioceptive feedback, terrain classification, dynamic gait adaptation. Complete sensor suite and GoPro footage from challenging environments.",
    price_usd: "3499",
    category: "robotics",
    size_bytes: 445 * 1024 * 1024 * 1024, // 445 GB
    size_formatted: "445 GB",
    file_format: "ROS2 Bag, GoPro MP4",
    tags: ["quadruped", "outdoor", "terrain", "anymal", "proprioception", "hiking"],
    thumbnail_url: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=400&h=300&fit=crop",
    verification_score: 97,
    status: "live",
  },
];

async function seedDatasets() {
  console.log('Starting database seed...');

  // Find or create demo user
  const demoEmail = 'demo@exchainge.com';
  const demoPrivyId = 'did:privy:demo-seed-user';

  let demoUserId: string;

  // Check if demo user exists
  const { data: existingUser, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('privy_id', demoPrivyId)
    .single();

  if (existingUser) {
    demoUserId = existingUser.id;
    console.log(`✓ Found existing demo user: ${demoUserId}`);
  } else {
    // Create demo user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        privy_id: demoPrivyId,
        email: demoEmail,
        email_verified: true,
        display_name: 'Demo Marketplace',
        bio: 'Curated sample datasets for the ExchAInge marketplace',
        account_type: 'enterprise',
        reputation_score: 100,
      })
      .select('id')
      .single();

    if (createError || !newUser) {
      console.error('Failed to create demo user:', createError);
      process.exit(1);
    }

    demoUserId = newUser.id;
    console.log(`✓ Created demo user: ${demoUserId}`);
  }

  // Insert datasets
  let successCount = 0;
  let errorCount = 0;

  for (const dataset of sampleDatasets) {
    try {
      const { data, error } = await supabase
        .from('datasets')
        .insert({
          user_id: demoUserId,
          title: dataset.title,
          description: dataset.description,
          category: dataset.category,
          tags: dataset.tags,
          price_usdc: parseFloat(dataset.price_usd),
          license_type: 'view_only_shared',
          commercial_use: true,
          derivative_works_allowed: true,
          ai_training_allowed: true,
          file_format: dataset.file_format,
          size_bytes: dataset.size_bytes,
          size_formatted: dataset.size_formatted,
          storage_provider: 'external',
          storage_key: `demo/${dataset.title.toLowerCase().replace(/\s+/g, '-')}`,
          thumbnail_url: dataset.thumbnail_url,
          verification_status: true,
          verification_score: dataset.verification_score,
          verification_date: new Date(),
          status: dataset.status,
          is_marketplace_only: true,
          view_count: Math.floor(Math.random() * 2000) + 500,
          download_count: Math.floor(Math.random() * 200) + 50,
          purchase_count: Math.floor(Math.random() * 100) + 10,
        })
        .select()
        .single();

      if (error) {
        console.error(`✗ Failed to insert ${dataset.title}:`, error.message);
        errorCount++;
      } else {
        console.log(`✓ Inserted: ${dataset.title}`);
        successCount++;
      }
    } catch (err) {
      console.error(`✗ Error inserting ${dataset.title}:`, err);
      errorCount++;
    }
  }

  console.log(`\n✓ Seed complete! ${successCount} datasets inserted, ${errorCount} errors.`);
}

seedDatasets()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
