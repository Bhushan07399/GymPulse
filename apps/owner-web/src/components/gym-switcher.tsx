'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, ChevronDown, Plus, Check, MapPin, Sparkles, X, ArrowUpRight } from 'lucide-react';
import { getMyGymLocations, switchGymLocation, createGymLocation, GymLocation } from '@/src/services/gym-locations.service';
import { getDashboardSummary } from '@/src/services/dashboard.service';
import { getEntitlements } from '@/src/lib/entitlements';

export function GymSwitcher() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGymName, setNewGymName] = useState('');
  const [newGymCity, setNewGymCity] = useState('');
  const [newGymAddress, setNewGymAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary
  });

  const { data: locations = [] } = useQuery<GymLocation[]>({
    queryKey: ['myGymLocations'],
    queryFn: getMyGymLocations
  });

  const switchMutation = useMutation({
    mutationFn: (gymId: string) => switchGymLocation(gymId),
    onSuccess: () => {
      setIsOpen(false);
      queryClient.invalidateQueries();
      window.location.reload();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error?.message || err.message || 'Failed to switch gym location');
    }
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; city: string; address: string }) => createGymLocation(payload),
    onSuccess: () => {
      setIsAddModalOpen(false);
      setNewGymName('');
      setNewGymCity('');
      setNewGymAddress('');
      setErrorMsg('');
      queryClient.invalidateQueries();
      window.location.reload();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error?.message || err.message || 'Failed to create gym location');
    }
  });

  const entitlements = getEntitlements(summaryQuery.data);
  const currentGym = locations.find((loc) => loc.isCurrent) || locations[0];

  // STRICT SINGLE-GYM HIDING:
  // Only display the switcher if the owner has an active Multi-Gym subscription
  const isMultiGymOwner = Boolean(entitlements.hasMultiGym);

  if (!isMultiGymOwner) {
    return null;
  }

  const maxLocations = entitlements.maxLocations || currentGym?.maxLocations || 2;
  const currentCount = locations.length;
  const isAtCapacity = currentCount >= maxLocations;

  return (
    <div className="relative">
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white/80 px-3.5 py-2 text-left shadow-sm hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <div className="flex size-7 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm shrink-0">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="flex flex-col min-w-0 pr-1">
          <span className="text-xs font-black tracking-tight text-slate-900 truncate">
            {currentGym?.name || 'GymPulse Fitness'}
          </span>
          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
            <MapPin className="h-2.5 w-2.5 text-blue-600 inline" />
            {currentGym?.city || 'Main Branch'}
            <span className="ml-1 inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-black text-blue-700">
              {currentCount} / {maxLocations} Locations
            </span>
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl ring-1 ring-slate-900/5 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100 mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Your Gym Locations
              </span>
              <span className="text-[10px] font-black text-slate-600">
                {currentCount} / {maxLocations} Used
              </span>
            </div>

            <div className="space-y-1 max-h-56 overflow-y-auto">
              {locations.map((loc) => {
                const isSelected = loc.isCurrent;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    disabled={isSelected || switchMutation.isPending}
                    onClick={() => switchMutation.mutate(loc.id)}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-sm font-bold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`size-2 rounded-full shrink-0 ${isSelected ? 'bg-blue-400' : 'bg-slate-300'}`} />
                      <div className="truncate">
                        <div className="truncate text-xs">{loc.name}</div>
                        <div className={`text-[10px] font-normal truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {loc.city || 'Main Branch'}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-blue-400 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 mt-2 border-t border-slate-100">
              {isAtCapacity ? (
                <div className="rounded-xl bg-slate-50 p-2.5 text-center border border-slate-200/80">
                  <p className="text-[10px] font-bold text-slate-600">
                    Location limit reached ({currentCount}/{maxLocations})
                  </p>
                  <Link
                    href="/subscription"
                    onClick={() => setIsOpen(false)}
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-black text-blue-600 hover:text-blue-700"
                  >
                    Upgrade plan to add more locations <ArrowUpRight className="size-3" />
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsAddModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-2 text-xs font-bold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all"
                >
                  <Plus className="h-3.5 w-3.5 text-blue-600" />
                  Add New Gym Location
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ADD GYM LOCATION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0F172A]/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Add Gym Location</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {currentCount} of {maxLocations} locations used
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-900">
                {errorMsg}
              </div>
            )}

            {isAtCapacity ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                <p className="text-xs font-bold text-amber-900">
                  Maximum location limit ({maxLocations} locations) reached for your current plan.
                </p>
                <p className="text-[11px] text-amber-800">
                  Upgrade your plan to unlock more locations across your fitness network.
                </p>
                <Link
                  href="/subscription"
                  onClick={() => setIsAddModalOpen(false)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-900 px-4 py-2 text-xs font-bold text-white hover:bg-amber-950 transition"
                >
                  Configure Multi-Gym Plan
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Gym Location Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. IronPulse Fitness — Miraj"
                    value={newGymName}
                    onChange={(e) => setNewGymName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    City / Branch *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Miraj"
                    value={newGymCity}
                    onChange={(e) => setNewGymCity(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Station Road, Near Central Mall"
                    value={newGymAddress}
                    onChange={(e) => setNewGymAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <p className="text-[11px] text-slate-500 font-medium">
                  This new location will automatically inherit your {entitlements.plan} plan and share your multi-gym quota.
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-1/2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isAtCapacity || !newGymName.trim() || createMutation.isPending}
                onClick={() =>
                  createMutation.mutate({
                    name: newGymName,
                    city: newGymCity,
                    address: newGymAddress
                  })
                }
                className="w-1/2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Location'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
