import { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Sample data based on the provided information
const sampleVehicles = [
  {
    tripNumber: "LT1O1600296B1",
    plateNumber: "GAQ8J07,JXB6D58",
    driver: "ANDERSON LEOPOLDINO",
    scheduledArrival: "",
    actualArrival: "06/01/2024 08:27",
    origin: "SoC_SP_Campinas",
    packages: "",
    tos: "",
    fanout: "SOC-SP3",
    unloadingTime: "",
    type: "INSUMOS"
  },
  {
    tripNumber: "LT0O15000OI01",
    plateNumber: "GAQ8J07,JXB6D58",
    driver: "ANDERSON LEOPOLDINO",
    scheduledArrival: "",
    actualArrival: "05/01/2024 09:16",
    origin: "SoC_SP_Campinas",
    packages: "",
    tos: "",
    fanout: "SOC-SP3",
    unloadingTime: "",
    type: "INSUMOS"
  },
  {
    tripNumber: "LT0O2S000XYD1",
    plateNumber: "PZN4B28,EGJ8527",
    driver: "GILVANDO DUARTE",
    scheduledArrival: "",
    actualArrival: "28/02/2024 11:59",
    origin: "SoC_SP_Campinas",
    packages: "",
    tos: "",
    fanout: "SOC-SP3",
    unloadingTime: "",
    type: "INSUMOS"
  },
  {
    tripNumber: "LT0O6B011P2K1",
    plateNumber: "EJY8F22,IMM3A21",
    driver: "Osmar Souza de Jesus",
    scheduledArrival: "",
    actualArrival: "11/06/2024 10:21",
    origin: "SoC_SP_Campinas",
    packages: "",
    tos: "",
    fanout: "SOC-SP3",
    unloadingTime: "11/06/2024 13:49",
    type: "INSUMOS"
  },
  {
    tripNumber: "LT0O480017FP1",
    plateNumber: "LLT9G41",
    driver: "ALEXSANDER GUILHERME DA SILVA OELKE",
    scheduledArrival: "",
    actualArrival: "09/04/2024 01:46",
    origin: "SoC_SP_Campinas",
    packages: "",
    tos: "",
    fanout: "SOC-SP3",
    unloadingTime: "08/04/2024 02:48",
    type: "INSUMOS"
  },
  {
    tripNumber: "LT0O5H010R5R1",
    plateNumber: "LLT9G41",
    driver: "ALEXSANDER GUILHERME DA SILVA OELKE",
    scheduledArrival: "",
    actualArrival: "18/05/2024 01:58",
    origin: "SoC_SP_Campinas",
    packages: "",
    tos: "",
    fanout: "SOC-SP3",
    unloadingTime: "18/05/2024 03:54",
    type: "INSUMOS"
  },
  {
    tripNumber: "LT0O3M00121D1",
    plateNumber: "DJB2I63",
    driver: "Davi Luiz de Oliveira",
    scheduledArrival: "",
    actualArrival: "22/03/2024 22:43",
    origin: "SoC_SP_Campinas",
    packages: "",
    tos: "",
    fanout: "SOC-SP3",
    unloadingTime: "22/03/2024 23:52",
    type: "INSUMOS"
  },
  {
    tripNumber: "LT1O27002GQE1",
    plateNumber: "EKH6C07,CUC8J99",
    driver: "NIVALDO ANTUNES DA SILVA JUNIOR",
    scheduledArrival: "",
    actualArrival: "07/02/2024 08:04",
    origin: "SoC_SP_Campinas",
    packages: "",
    tos: "",
    fanout: "SOC-SP3",
    unloadingTime: "",
    type: "INSUMOS"
  },
  {
    tripNumber: "LT0O5N010ZBX1",
    plateNumber: "GFV3D65",
    driver: "CARLOS ALBERTO FELIPE GONCALVES DE JESUS",
    scheduledArrival: "",
    actualArrival: "23/05/2024 04:55",
    origin: "SoC_SP_Campinas",
    packages: "",
    tos: "",
    fanout: "SOC-SP3",
    unloadingTime: "23/05/2024 07:32",
    type: "INSUMOS"
  },
  {
    tripNumber: "LT0O4P00YNJW1",
    plateNumber: "GAQ8J07,JXB6D58",
    driver: "Luiz Carlos de Souza Oelke",
    scheduledArrival: "",
    actualArrival: "25/04/2024 22:02",
    origin: "SoC_SP_Campinas",
    packages: "",
    tos: "",
    fanout: "SOC-SP3",
    unloadingTime: "25/04/2024 23:10",
    type: "INSUMOS"
  },
  {
    tripNumber: "LT0NCK000NAB1",
    plateNumber: "LLT9G41",
    driver: "ALEXSANDER GUILHERME DA SILVA OELKE",
    scheduledArrival: "",
    actualArrival: "20/12/2023 08:57",
    origin: "SoC_SP_Campinas",
    packages: "",
    tos: "",
    fanout: "SOC-SP3",
    unloadingTime: "",
    type: "INSUMOS"
  },
  {
    tripNumber: "LT1NCM0026GZ1",
    plateNumber: "",
    driver: "JOSE IVO ALVES",
    scheduledArrival: "",
    actualArrival: "22/12/2023 20:54",
    origin: "SoC_SP_Campinas",
    packages: "",
    tos: "",
    fanout: "SOC-SP3",
    unloadingTime: "",
    type: "INSUMOS"
  },
  {
    tripNumber: "LT0NCN000NAB1",
    plateNumber: "EXN5H91",
    driver: "WILLIAN PRADO SANCHES FELIX",
    scheduledArrival: "",
    actualArrival: "",
    origin: "SoC_SP_Campinas",
    packages: "",
    tos: "",
    fanout: "SOC-SP3",
    unloadingTime: "",
    type: "INSUMOS"
  }
];

// Helper function to determine vehicle status
const getVehicleStatus = (vehicle) => {
  if (!vehicle.actualArrival) {
    return "scheduled";
  } else if (vehicle.actualArrival && !vehicle.unloadingTime) {
    return "waiting";
  } else if (vehicle.unloadingTime) {
    return "completed";
  }
  return "unknown";
};

// Helper to get status color
const getStatusColor = (status) => {
  switch (status) {
    case "scheduled":
      return "bg-blue-100 text-blue-800";
    case "waiting":
      return "bg-yellow-100 text-yellow-800";
    case "unloading":
      return "bg-orange-100 text-orange-800";
    case "completed":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Status chip component
const StatusChip = ({ status }) => {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Dashboard Header Component
const DashboardHeader = ({ counts }) => {
  return (
    <div className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Vehicle Arrival Monitoring</h1>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Vehicles</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{counts.total}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Scheduled</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{counts.scheduled}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Waiting</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{counts.waiting}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{counts.completed}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Search and Filter Component
const SearchAndFilter = ({ onSearchChange, onStatusFilterChange, selectedStatus }) => {
  return (
    <div className="bg-white px-4 py-5 border-b border-gray-200 sm:px-6">
      <div className="-ml-4 -mt-2 flex flex-wrap items-center justify-between sm:flex-nowrap">
        <div className="ml-4 mt-2">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Vehicle List</h3>
        </div>
        <div className="ml-4 mt-2 flex-shrink-0">
          <div className="flex space-x-3">
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              onChange={onStatusFilterChange}
              value={selectedStatus}
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="waiting">Waiting</option>
              <option value="completed">Completed</option>
            </select>
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search..."
                onChange={onSearchChange}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Vehicle Table Component
const VehicleTable = ({ vehicles }) => {
  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trip Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle & Driver
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Arrival Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Origin
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fanout
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unloading Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.map((vehicle) => {
                  const status = getVehicleStatus(vehicle);
                  return (
                    <tr key={vehicle.tripNumber} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusChip status={status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {vehicle.tripNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{vehicle.plateNumber}</div>
                            <div className="text-sm text-gray-500">{vehicle.driver}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {vehicle.actualArrival ? vehicle.actualArrival : 'Not arrived'}
                        </div>
                        {vehicle.scheduledArrival && (
                          <div className="text-sm text-gray-500">Scheduled: {vehicle.scheduledArrival}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.origin}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.fanout}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.unloadingTime || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const [vehicles, setVehicles] = useState(sampleVehicles);
  const [filteredVehicles, setFilteredVehicles] = useState(sampleVehicles);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Count vehicles by status
  const counts = {
    total: vehicles.length,
    scheduled: vehicles.filter(v => getVehicleStatus(v) === 'scheduled').length,
    waiting: vehicles.filter(v => getVehicleStatus(v) === 'waiting').length,
    completed: vehicles.filter(v => getVehicleStatus(v) === 'completed').length
  };

  // Handle search
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle status filter
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Apply filters
  useEffect(() => {
    let filtered = vehicles;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vehicle => getVehicleStatus(vehicle) === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(vehicle => 
        vehicle.tripNumber.toLowerCase().includes(term) ||
        vehicle.plateNumber.toLowerCase().includes(term) ||
        vehicle.driver.toLowerCase().includes(term) ||
        vehicle.origin.toLowerCase().includes(term) ||
        vehicle.fanout.toLowerCase().includes(term)
      );
    }
    
    setFilteredVehicles(filtered);
  }, [searchTerm, statusFilter, vehicles]);

  // Future API call to fetch vehicle data
  const fetchVehicleData = async () => {
    try {
      // This would be replaced with an actual API call to Google Sheets API
      // const response = await axios.get(`${API}/vehicles`);
      // setVehicles(response.data);
      // For now, we're using the sample data
      console.log("In a real app, this would fetch data from Google Sheets API");
    } catch (e) {
      console.error("Error fetching vehicle data:", e);
    }
  };

  useEffect(() => {
    fetchVehicleData();
    // In a real app, set up a periodic refresh
    // const intervalId = setInterval(fetchVehicleData, 60000); // Refresh every minute
    // return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <main>
        <DashboardHeader counts={counts} />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <SearchAndFilter 
                onSearchChange={handleSearchChange} 
                onStatusFilterChange={handleStatusFilterChange}
                selectedStatus={statusFilter}
              />
              <VehicleTable vehicles={filteredVehicles} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
