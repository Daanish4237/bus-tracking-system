/** In-memory data store + seed data */

import { Route, Stop, BusLocation, StopRequest } from './types';

export const routes = new Map<string, Route>();
export const stops = new Map<string, Stop>();
export const busLocations = new Map<string, BusLocation>();
export const stopRequests = new Map<string, StopRequest>();
export const STALE_MS = 5 * 60 * 1000;

export function seed(): void {
  const now = new Date('2024-01-01');

  const stopData: Stop[] = [
    // Sample routes
    { id: 'stop-101-1', name: 'Central Station',    latitude: 40.7589, longitude: -73.9851, address: '123 Main St',            createdAt: now, updatedAt: now },
    { id: 'stop-101-2', name: 'City Hall',           latitude: 40.7614, longitude: -73.9776, address: '456 Broadway',           createdAt: now, updatedAt: now },
    { id: 'stop-101-3', name: 'Union Square',        latitude: 40.7359, longitude: -73.9911, address: '789 Park Ave',           createdAt: now, updatedAt: now },
    { id: 'stop-101-4', name: 'Financial District',  latitude: 40.7074, longitude: -74.0113, address: '321 Wall St',            createdAt: now, updatedAt: now },
    { id: 'stop-101-5', name: 'Battery Park',        latitude: 40.7033, longitude: -74.0170, address: '555 Battery Pl',         createdAt: now, updatedAt: now },
    { id: 'stop-202-1', name: 'Grand Central',       latitude: 40.7527, longitude: -73.9772, address: '100 E 42nd St',          createdAt: now, updatedAt: now },
    { id: 'stop-202-2', name: 'Museum Mile',         latitude: 40.7794, longitude: -73.9632, address: '200 5th Ave',            createdAt: now, updatedAt: now },
    { id: 'stop-202-3', name: 'Central Park North',  latitude: 40.7979, longitude: -73.9520, address: '300 Central Park N',     createdAt: now, updatedAt: now },
    { id: 'stop-202-4', name: 'Columbia University', latitude: 40.8075, longitude: -73.9626, address: '400 W 116th St',         createdAt: now, updatedAt: now },
    { id: 'stop-202-5', name: 'Washington Heights',  latitude: 40.8448, longitude: -73.9388, address: '500 W 181st St',         createdAt: now, updatedAt: now },
    { id: 'stop-202-6', name: 'Fort Tryon Park',     latitude: 40.8648, longitude: -73.9318, address: '600 Margaret Corbin Dr', createdAt: now, updatedAt: now },
    { id: 'stop-303-1', name: 'West Side Terminal',  latitude: 40.7589, longitude: -74.0014, address: '700 West End Ave',       createdAt: now, updatedAt: now },
    { id: 'stop-303-2', name: 'Lincoln Center',      latitude: 40.7722, longitude: -73.9843, address: '800 Columbus Ave',       createdAt: now, updatedAt: now },
    { id: 'stop-303-3', name: 'Times Square',        latitude: 40.7580, longitude: -73.9855, address: '900 7th Ave',            createdAt: now, updatedAt: now },
    { id: 'stop-303-4', name: 'Bryant Park',         latitude: 40.7536, longitude: -73.9832, address: '1000 6th Ave',           createdAt: now, updatedAt: now },
    { id: 'stop-303-5', name: 'East Side Plaza',     latitude: 40.7489, longitude: -73.9680, address: '1100 Lexington Ave',     createdAt: now, updatedAt: now },

    // Bus 541 — Kinrara / Puncak Jalil / Lestari Perdana
    { id: 's541-01', name: 'LRT Kinrara BK5',                                latitude: 3.05046, longitude: 101.64427, address: 'LRT Kinrara BK5, Bandar Kinrara, Puchong',          createdAt: now, updatedAt: now },
    { id: 's541-02', name: 'SMK SEKSYEN 4 BANDAR KINRARA',                   latitude: 3.04603, longitude: 101.64575, address: 'SMK Seksyen 4, Bandar Kinrara, Puchong',            createdAt: now, updatedAt: now },
    { id: 's541-03', name: 'KINRARA GOLF CLUB (BARAT)',                      latitude: 3.03727, longitude: 101.65484, address: 'Jalan Kinrara, Bandar Kinrara, Puchong',            createdAt: now, updatedAt: now },
    { id: 's541-04', name: 'Kejuruteraan Bomba Kinrara',                     latitude: 3.04010, longitude: 101.65143, address: 'SJ15 Kejuruteraan Bomba, Bandar Kinrara',           createdAt: now, updatedAt: now },
    { id: 's541-05', name: 'KINRARA GOLF CLUB (OPP)  ',                      latitude: 3.03703, longitude: 101.65454, address: 'Kinrara Golf Club , Bandar Kinrara, Puchong',       createdAt: now, updatedAt: now },
    { id: 's541-06', name: 'Perumahan Hening',                               latitude: 3.03624, longitude: 101.65746, address: 'Hening, Puchong',                                   createdAt: now, updatedAt: now },
    { id: 's541-07', name: 'Perumahan Melody',                               latitude: 3.03608, longitude: 101.65992, address: 'Bandar Kinrara, Puchong',                           createdAt: now, updatedAt: now },
    { id: 's541-08', name: 'Melody Kinrara',                                 latitude: 3.03598, longitude: 101.6648, address: 'Melodi, Puchong',                                  createdAt: now, updatedAt: now },
    { id: 's541-09', name: 'Simfoni Kinrara',                                latitude: 3.03580, longitude: 101.66670, address: 'Bandar Kinrara 6, Puchong',                       createdAt: now, updatedAt: now },
    { id: 's541-10', name: 'Pangsapuri Enggang',                             latitude: 3.03585, longitude: 101.67275, address: 'Bandar Kinrara 6, Puchong',                       createdAt: now, updatedAt: now },
    { id: 's541-11', name: 'Perumahan PUJ 6 (Barat)',                        latitude: 3.02553, longitude: 101.67984, address: 'Puj 6, Seri Kembangan',                         createdAt: now, updatedAt: now },
    { id: 's541-12', name: 'Komersial PUJ 3 (Utara)',                        latitude: 3.02299, longitude: 101.67523, address: 'Puj 3, Seri Kembangan',                   createdAt: now, updatedAt: now },
    { id: 's541-13', name: 'Perumahan PUJ 5',                                latitude: 3.02112, longitude: 101.67418, address: 'Puj 5, Seri Kembangan',                   createdAt: now, updatedAt: now },
    { id: 's541-14', name: 'PUJ 4 Taman Puncak Jalil',                       latitude: 3.01792, longitude: 101.67484, address: 'Puj 5, Seri Kembangan',                   createdAt: now, updatedAt: now },
    { id: 's541-15', name: 'Pangsapuri Casa Riana',                          latitude: 3.01486, longitude: 101.67525, address: 'Seri Kembangan, Selangor',             createdAt: now, updatedAt: now },
    { id: 's541-16', name: 'Lestari Perdana 8',                              latitude: 3.01187, longitude: 101.67180, address: 'Lestari Perdana, Seri Kembangan',             createdAt: now, updatedAt: now },
    { id: 's541-17', name: 'Flat Lestari Perdana 2 (OPP)',                   latitude: 3.00796, longitude: 101.66651, address: 'Seri Kembangan, Selangor',                   createdAt: now, updatedAt: now },
    { id: 's541-18', name: 'SMK Taman Desaminium',                           latitude: 3.00634, longitude: 101.66096, address: 'Taman Desaminium Jalan Arif, Seri Kembangan',             createdAt: now, updatedAt: now },
    { id: 's541-19', name: 'Desaminium Flora',                               latitude: 3.00796, longitude: 101.66476, address: 'Taman Desaminium, Seri Kembangan',                      createdAt: now, updatedAt: now },
    { id: 's541-20', name: 'Pangsapuri Sri Indah Blok 11',                   latitude: 2.99959, longitude: 101.66478, address: 'Seri Kembangan, Selangor',      createdAt: now, updatedAt: now },
    { id: 's541-21', name: 'Hentian Putra Permai',                           latitude: 2.99580, longitude: 101.66901, address: 'Taman Putra Permai, Seri Kembangan',                   createdAt: now, updatedAt: now },
    { id: 's541-22', name: 'Komersial LP 2A',                                latitude: 2.99507, longitude: 101.67179, address: 'Lestari Perdana, Seri Kembangan',            createdAt: now, updatedAt: now },
    { id: 's541-23', name: 'Aeon Jusco Equine Park',                         latitude: 2.99360, longitude: 101.67423, address: 'Taman Equine, Seri Kembangan',        createdAt: now, updatedAt: now },
    { id: 's541-24', name: 'Aeon Jusco Equine Park (Opposite)',              latitude: 2.99331, longitude: 101.67409, address: 'Lestari Perdana, Seri Kembangan',                     createdAt: now, updatedAt: now },
    { id: 's541-25', name: 'MRT Taman Equine Gate B',                        latitude: 2.98985, longitude: 101.67230, address: 'Pusat Bandar Putra Permai, Seri Kembangan',     createdAt: now, updatedAt: now },
  ];
  stopData.forEach(s => stops.set(s.id, s));

  const routeData: Route[] = [
    { id: 'route-101', name: 'Downtown Express',  stopIds: ['stop-101-1','stop-101-2','stop-101-3','stop-101-4','stop-101-5'], isActive: true, createdAt: now, updatedAt: now },
    { id: 'route-202', name: 'Uptown Local',       stopIds: ['stop-202-1','stop-202-2','stop-202-3','stop-202-4','stop-202-5','stop-202-6'], isActive: true, createdAt: now, updatedAt: now },
    { id: 'route-303', name: 'Crosstown Shuttle',  stopIds: ['stop-303-1','stop-303-2','stop-303-3','stop-303-4','stop-303-5'], isActive: true, createdAt: now, updatedAt: now },
    {
      id: 'route-541', name: 'Bus 541 — Kinrara BK5 → Putra Permai',
      stopIds: ['s541-01','s541-02','s541-03','s541-04','s541-05','s541-06','s541-07','s541-08','s541-09','s541-10','s541-11','s541-12','s541-13','s541-14','s541-15','s541-16','s541-17','s541-18','s541-19','s541-20','s541-21','s541-22','s541-23','s541-24','s541-25'],
      isActive: true, createdAt: now, updatedAt: now
    },
  ];
  routeData.forEach(r => routes.set(r.id, r));

  const busData: BusLocation[] = [
    { busId: 'bus-001', routeId: 'route-101', latitude: 40.7614, longitude: -73.9776, timestamp: new Date(), speed: 25, heading: 180 },
    { busId: 'bus-002', routeId: 'route-202', latitude: 40.8027, longitude: -73.9573, timestamp: new Date(), speed: 30, heading: 0 },
    { busId: 'bus-003', routeId: 'route-303', latitude: 40.7536, longitude: -73.9832, timestamp: new Date(), speed: 15, heading: 90 },
    { busId: 'bus-541', routeId: 'route-541', latitude: 3.0370,  longitude: 101.6558, timestamp: new Date(), speed: 30, heading: 135 },
  ];
  busData.forEach(b => busLocations.set(b.busId, b));
}
