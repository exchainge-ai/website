'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Filter, Send, X } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';

interface StickyPost {
  id: string;
  title: string;
  description: string;
  category: 'robotics' | 'autonomous_vehicles' | 'drone' | 'manipulation' | 'other';
  hardwareType: string;
  dataSize: string;
  author: string;
  color: 'yellow' | 'pink' | 'blue' | 'green' | 'purple';
  rotation: number;
  createdAt: Date;
  interestedCount?: number;
}

interface DataRequest {
  id: string;
  title: string;
  description: string;
  category: 'robotics' | 'autonomous_vehicles' | 'drone' | 'manipulation' | 'other';
  requiredHardware: string;
  estimatedBudget: string;
  author: string;
  createdAt: Date;
  interested: number;
}
interface DiscoveryApiEntry {
  id: string;
  entryType: 'pinboard' | 'request';
  title: string;
  description: string;
  category: string;
  hardwareType: string | null;
  dataSize: string | null;
  estimatedBudget: string | null;
  authorName: string | null;
  tags: string[];
  interestedCount: number;
  createdAt: string;
  updatedAt: string;
}

const COLOR_CHOICES: Array<'yellow' | 'pink' | 'blue' | 'green' | 'purple'> = [
  'yellow',
  'pink',
  'blue',
  'green',
  'purple',
];

const UI_CATEGORIES = new Set<StickyPost['category']>([
  'robotics',
  'autonomous_vehicles',
  'drone',
  'manipulation',
  'other',
]);

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0; // Keep 32bit
  }
  return hash;
}

function toUiCategory(raw: string): StickyPost['category'] {
  const normalized = raw.trim().toLowerCase() as StickyPost['category'];
  return UI_CATEGORIES.has(normalized) ? normalized : 'other';
}

function decoratePinboardEntry(entry: DiscoveryApiEntry): StickyPost {
  const hash = hashString(entry.id);
  const color = COLOR_CHOICES[Math.abs(hash) % COLOR_CHOICES.length];
  const rotation = ((hash % 400) / 100) - 2; // Range roughly -2 to 2

  return {
    id: entry.id,
    title: entry.title,
    description: entry.description,
    category: toUiCategory(entry.category),
    hardwareType: entry.hardwareType ?? 'Not specified',
    dataSize: entry.dataSize ?? 'TBD',
    author: entry.authorName ?? 'Community Member',
    color,
    rotation,
    createdAt: new Date(entry.createdAt),
    interestedCount: entry.interestedCount,
  };
}

function decorateRequestEntry(entry: DiscoveryApiEntry): DataRequest {
  return {
    id: entry.id,
    title: entry.title,
    description: entry.description,
    category: toUiCategory(entry.category),
    requiredHardware: entry.hardwareType ?? 'Not specified',
    estimatedBudget: entry.estimatedBudget ?? 'TBD',
    author: entry.authorName ?? 'Community Member',
    createdAt: new Date(entry.createdAt),
    interested: entry.interestedCount,
  };
}

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'robotics', label: 'Robotics' },
  { value: 'autonomous_vehicles', label: 'Autonomous Vehicles' },
  { value: 'drone', label: 'Drones' },
  { value: 'manipulation', label: 'Manipulation' },
  { value: 'other', label: 'Other' },
];

const COLOR_MAP = {
  yellow: 'bg-yellow-100 shadow-md hover:shadow-lg',
  pink: 'bg-pink-100 shadow-md hover:shadow-lg',
  blue: 'bg-blue-100 shadow-md hover:shadow-lg',
  green: 'bg-green-100 shadow-md hover:shadow-lg',
  purple: 'bg-purple-100 shadow-md hover:shadow-lg',
};

export default function DiscoveryHub() {
  const { authenticated, login, user, getAccessToken } = usePrivy();
  const [posts, setPosts] = useState<StickyPost[]>([]);
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'pinboard' | 'requests'>('pinboard');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [loadingPinboard, setLoadingPinboard] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [interestLoading, setInterestLoading] = useState<string | null>(null);

  // Form state for new sticky post
  const [newPost, setNewPost] = useState({
    title: '',
    description: '',
    category: 'robotics' as const,
    hardwareType: '',
    dataSize: '',
    author: 'Community Member',
  });

  // Form state for new data request
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    category: 'robotics' as const,
    requiredHardware: '',
    estimatedBudget: '',
    author: 'Community Member',
  });

  const fetchEntries = useCallback(
    async (type: 'pinboard' | 'request') => {
      const setLoading = type === 'pinboard' ? setLoadingPinboard : setLoadingRequests;
      setLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch(`/api/discovery?type=${type}`);
        if (!response.ok) {
          throw new Error(`Failed to load ${type}`);
        }

        const payload = (await response.json()) as {
          data?: DiscoveryApiEntry[];
        };
        const entries = payload.data ?? [];

        if (type === 'pinboard') {
          setPosts(entries.map(decoratePinboardEntry));
        } else {
          setRequests(entries.map(decorateRequestEntry));
        }
      } catch (error) {
        console.error('[Discovery] Failed to fetch entries', error);
        setErrorMessage('Failed to load the latest discovery posts.');
        if (type === 'pinboard') {
          setPosts([]);
        } else {
          setRequests([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchEntries('pinboard');
    void fetchEntries('request');
  }, [fetchEntries]);

  const openModalForTab = (tab: 'pinboard' | 'requests') => {
    if (!authenticated) {
      login();
      return;
    }
    if (tab === 'pinboard') {
      setActiveTab('pinboard');
      setShowNewPostModal(true);
    } else {
      setActiveTab('requests');
      setShowNewRequestModal(true);
    }
  };

  const primaryActionLabel = !authenticated
    ? 'Sign In to Post'
    : activeTab === 'pinboard'
      ? 'Signal Dataset Drop'
      : 'Post Data Request';

  const filteredPosts =
    selectedCategory === 'all'
      ? posts
      : posts.filter((p) => p.category === selectedCategory);

  const totalDataSize = filteredPosts.reduce((acc, post) => {
    const numeric = parseFloat(post.dataSize);
    return Number.isFinite(numeric) ? acc + numeric : acc;
  }, 0);

  const resolvedAuthorName = (fallback?: string) => {
    return (
      fallback?.trim() ||
      user?.email?.address ||
      user?.wallet?.address ||
      'Community Member'
    );
  };

  const handlePostToBoard = async () => {
    if (!newPost.title.trim() || !newPost.description.trim()) {
      alert('Please fill in title and description');
      return;
    }

    setSubmittingPost(true);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }

      const response = await fetch('/api/discovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          entryType: 'pinboard',
          title: newPost.title,
          description: newPost.description,
          category: newPost.category,
          hardwareType: newPost.hardwareType || undefined,
          dataSize: newPost.dataSize || undefined,
          authorName: resolvedAuthorName(newPost.author),
          tags: [],
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        console.error('[Discovery] Validation error details:', payload);
        throw new Error(payload.error || 'Failed to post to pinboard');
      }

      const payload = (await response.json()) as { data: DiscoveryApiEntry };
      const created = decoratePinboardEntry(payload.data);
      setPosts((prev) => [created, ...prev]);
      setNewPost({
        title: '',
        description: '',
        category: 'robotics',
        hardwareType: '',
        dataSize: '',
        author: resolvedAuthorName(newPost.author),
      });
      setShowNewPostModal(false);
    } catch (error) {
      console.error('[Discovery] Failed to post pinboard entry', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to post. Please try again.',
      );
    } finally {
      setSubmittingPost(false);
    }
  };

  const handlePostRequest = async () => {
    if (!newRequest.title.trim() || !newRequest.description.trim()) {
      alert('Please fill in title and description');
      return;
    }

    setSubmittingRequest(true);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }

      const response = await fetch('/api/discovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          entryType: 'request',
          title: newRequest.title,
          description: newRequest.description,
          category: newRequest.category,
          hardwareType: newRequest.requiredHardware || undefined,
          estimatedBudget: newRequest.estimatedBudget || undefined,
          authorName: resolvedAuthorName(newRequest.author),
          tags: [],
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        console.error('[Discovery] Validation error details:', payload);
        throw new Error(payload.error || 'Failed to submit data request');
      }

      const payload = (await response.json()) as { data: DiscoveryApiEntry };
      const created = decorateRequestEntry(payload.data);
      setRequests((prev) => [created, ...prev]);
      setNewRequest({
        title: '',
        description: '',
        category: 'robotics',
        requiredHardware: '',
        estimatedBudget: '',
        author: resolvedAuthorName(newRequest.author),
      });
      setShowNewRequestModal(false);
    } catch (error) {
      console.error('[Discovery] Failed to submit data request', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to submit request. Please try again.',
      );
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleRegisterInterest = async (
    entryId: string,
    entryType: 'pinboard' | 'request',
  ) => {
    if (!authenticated) {
      login();
      return;
    }

    setInterestLoading(entryId);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }

      const response = await fetch(`/api/discovery/${entryId}/interest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to register interest');
      }

      const payload = (await response.json()) as {
        data?: { id: string; interestedCount: number };
      };

      if (!payload.data) {
        return;
      }

      if (entryType === 'request') {
        setRequests((prev) =>
          prev.map((req) =>
            req.id === entryId ? { ...req, interested: payload.data!.interestedCount } : req,
          ),
        );
      } else {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === entryId
              ? { ...post, interestedCount: payload.data!.interestedCount }
              : post,
          ),
        );
      }
    } catch (error) {
      console.error('[Discovery] Failed to register interest', error);
      alert('Could not register your interest. Please try again later.');
    } finally {
      setInterestLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 sticky top-0 bg-gray-900/80 backdrop-blur-md border-b border-gray-700 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Discovery Hub
              </h1>
              <p className="text-gray-400 mt-2">
                Signal upcoming datasets or request the data you need—match supply and demand in one place.
              </p>
            </div>
            <button
              onClick={() => openModalForTab(activeTab)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all"
            >
              <Plus className="w-5 h-5" />
              {primaryActionLabel}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('pinboard')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'pinboard'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-gray-200'
              }`}
            >
              Pinboard ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'requests'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-gray-200'
              }`}
            >
              Data Requests ({requests.length})
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 mt-4">
          <div className="max-w-7xl mx-auto bg-red-900/30 border border-red-500/40 text-red-200 px-4 py-3 rounded-lg">
            {errorMessage}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="relative z-10 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors whitespace-nowrap"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>

            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Hardware Type</label>
                  <select className="w-full bg-gray-600 text-white rounded px-2 py-1 text-sm">
                    <option>All Hardware</option>
                    <option>Humanoid Robot</option>
                    <option>Autonomous Vehicle</option>
                    <option>Drone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Data Size</label>
                  <select className="w-full bg-gray-600 text-white rounded px-2 py-1 text-sm">
                    <option>Any Size</option>
                    <option>&lt; 50GB</option>
                    <option>50GB - 200GB</option>
                    <option>&gt; 200GB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Posted</label>
                  <select className="w-full bg-gray-600 text-white rounded px-2 py-1 text-sm">
                    <option>All Time</option>
                    <option>Last 7 Days</option>
                    <option>Last 24 Hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Status</label>
                  <select className="w-full bg-gray-600 text-white rounded px-2 py-1 text-sm">
                    <option>All</option>
                    <option>Available</option>
                    <option>Coming Soon</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'pinboard' ? (
            filteredPosts.length === 0 && loadingPinboard ? (
              <div className="text-center py-20 text-gray-400">
                Loading pinboard posts...
              </div>
            ) : (
              <>
                {/* Pinboard View */}
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-12">
                  <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-400">{filteredPosts.length}</div>
                    <div className="text-sm text-gray-400">Datasets Posted</div>
                  </div>
                  <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-400">
                      {totalDataSize.toFixed(0)}GB
                    </div>
                    <div className="text-sm text-gray-400">Data Available</div>
                  </div>
                  <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-purple-400">{filteredPosts.length * 50}</div>
                    <div className="text-sm text-gray-400">Community Members</div>
                  </div>
                </div>

                {/* Pinboard - Masonry layout with sticky notes */}
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                  {filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className={`break-inside-avoid ${COLOR_MAP[post.color]} rounded-lg p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-2xl`}
                      style={{
                        transform: `rotate(${post.rotation}deg)`,
                      }}
                    >
                      {/* Pin indicator */}
                      <div className="flex justify-center -mt-12 mb-4">
                        <div className="w-4 h-4 bg-red-500 rounded-full shadow-lg"></div>
                      </div>

                      <div className="space-y-3">
                        {/* Category badge */}
                        <div className="inline-block">
                          <span className="text-xs font-semibold bg-gray-700 text-gray-100 px-2 py-1 rounded">
                            {CATEGORIES.find((c) => c.value === post.category)?.label}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{post.title}</h3>

                        {/* Description */}
                        <p className="text-sm text-gray-800 line-clamp-3">{post.description}</p>

                        {/* Details */}
                        <div className="space-y-2 pt-2 border-t border-gray-300/50">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-700">
                              <strong>Hardware:</strong> {post.hardwareType}
                            </span>
                            <span className="text-gray-700">
                              <strong>Size:</strong> {post.dataSize}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-xs font-medium text-gray-700">— {post.author}</span>
                            <button
                              disabled={interestLoading === post.id}
                              onClick={() => handleRegisterInterest(post.id, 'pinboard')}
                              className={`text-xs bg-gray-700 text-gray-100 hover:bg-gray-800 px-3 py-1 rounded transition-colors ${interestLoading === post.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                              {interestLoading === post.id ? 'Submitting...' : 'Interested'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Empty state */}
                {!loadingPinboard && filteredPosts.length === 0 && (
                  <div className="text-center py-20">
                    <p className="text-gray-400 text-lg">No datasets in this category yet.</p>
                    <p className="text-gray-500 text-sm mt-2">Be the first to post!</p>
                  </div>
                )}
              </>
            )
          ) : (
            <>
              {/* Requests View */}
              {requests.length === 0 && loadingRequests ? (
                <div className="text-center py-20 text-gray-400">
                  Loading data requests...
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {requests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 hover:border-gray-600 hover:shadow-lg transition-all"
                  >
                    {/* Category badge */}
                    <div className="inline-block mb-3">
                      <span className="text-xs font-semibold bg-amber-900 text-amber-200 px-2 py-1 rounded">
                        {CATEGORIES.find((c) => c.value === request.category)?.label}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-white mb-2">{request.title}</h3>

                    {/* Description */}
                    <p className="text-sm text-gray-300 mb-4">{request.description}</p>

                    {/* Details */}
                    <div className="space-y-2 mb-4 py-3 border-t border-b border-gray-700">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Hardware:</span>
                        <span className="text-gray-200">{request.requiredHardware}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Budget:</span>
                        <span className="text-green-400 font-semibold">{request.estimatedBudget}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400">By {request.author}</span>
                        <span className="text-xs text-gray-500">{request.interested} interested</span>
                      </div>
                      <button
                        onClick={() => handleRegisterInterest(request.id, 'request')}
                        disabled={interestLoading === request.id}
                        className={`bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 transition-colors ${interestLoading === request.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <Send className="w-3 h-3" />
                        {interestLoading === request.id ? 'Submitting...' : authenticated ? 'Interested' : 'Sign In'}
                      </button>
                    </div>
                  </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loadingRequests && requests.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-gray-400 text-lg">No data requests at the moment.</p>
                  <p className="text-gray-500 text-sm mt-2">Check back later or post your own dataset!</p>
                </div>
              )}
            </>
          )}
      </div>
    </div>

      {/* CTA Footer */}
      <div className="relative z-10 border-t border-gray-700 bg-gray-800/50 backdrop-blur-sm py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Share Your Data?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Use the matching board to float upcoming datasets or broadcast what data you're hunting for. Gauge interest before you launch.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => openModalForTab('pinboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all"
            >
              {authenticated ? 'Signal Dataset Drop' : 'Sign In to Post'}
            </button>
            <button
              onClick={() => openModalForTab('requests')}
              className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-lg font-semibold transition-all"
            >
              {authenticated ? 'Post Data Request' : 'Sign In to Request'}
            </button>
            <Link
              href="/marketplace"
              className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-all text-center"
            >
              Go to Marketplace
            </Link>
          </div>
          <p className="text-gray-500 text-sm mt-6">
            Early contributors get featured placement and priority support
          </p>
        </div>
      </div>

      {/* New Pinboard Post Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">Signal an Upcoming Dataset</h3>
                <p className="text-sm text-gray-400">
                  Float an unverified dataset you may publish soon and see who's interested.
                </p>
              </div>
              <button
                onClick={() => setShowNewPostModal(false)}
                className="rounded-full p-1 text-gray-400 hover:text-white hover:bg-gray-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                <input
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  value={newPost.title}
                  onChange={(event) =>
                    setNewPost((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="Headline for your potential dataset drop"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  rows={4}
                  value={newPost.description}
                  onChange={(event) =>
                    setNewPost((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Describe the dataset you might release and what makes it valuable."
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                  <select
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    value={newPost.category}
                    onChange={(event) =>
                      setNewPost(
                        (prev) => ({ ...prev, category: event.target.value as typeof prev.category }),
                      )
                    }
                  >
                    {CATEGORIES.filter((cat) => cat.value !== 'all').map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Hardware Type</label>
                  <input
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    value={newPost.hardwareType}
                    onChange={(event) =>
                      setNewPost((prev) => ({ ...prev, hardwareType: event.target.value }))
                    }
                    placeholder="e.g. Humanoid robot rig"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Approx. Data Size</label>
                  <input
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    value={newPost.dataSize}
                    onChange={(event) =>
                      setNewPost((prev) => ({ ...prev, dataSize: event.target.value }))
                    }
                    placeholder="e.g. ~250GB"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Your Name / Org</label>
                  <input
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    value={newPost.author}
                    onChange={(event) =>
                      setNewPost((prev) => ({ ...prev, author: event.target.value }))
                    }
                    placeholder="Visible to people browsing this board"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowNewPostModal(false)}
                  className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePostToBoard}
                  disabled={submittingPost}
                  className={`rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors ${submittingPost ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                >
                  {submittingPost ? 'Posting…' : 'Signal Dataset Drop'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Data Request Modal */}
      {showNewRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">Request a Dataset</h3>
                <p className="text-sm text-gray-400">
                  Broadcast the data you need so potential contributors can reach out.
                </p>
              </div>
                <button
                  onClick={() => setShowNewRequestModal(false)}
                  className="rounded-full p-1 text-gray-400 hover:text-white hover:bg-gray-800"
                  aria-label="Close"
                >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                <input
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  value={newRequest.title}
                  onChange={(event) =>
                    setNewRequest((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="What dataset are you looking for?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  rows={4}
                  value={newRequest.description}
                  onChange={(event) =>
                    setNewRequest((prev) => ({ ...prev, description: event.target.value }))
                  }
                    placeholder="Explain the use case and any formats, labels, or quality you require."
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                  <select
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    value={newRequest.category}
                    onChange={(event) =>
                      setNewRequest(
                        (prev) => ({ ...prev, category: event.target.value as typeof prev.category }),
                      )
                    }
                  >
                    {CATEGORIES.filter((cat) => cat.value !== 'all').map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Required Hardware</label>
                  <input
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    value={newRequest.requiredHardware}
                    onChange={(event) =>
                      setNewRequest((prev) => ({ ...prev, requiredHardware: event.target.value }))
                    }
                    placeholder="e.g. Thermal drone + RGB camera"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Budget Range</label>
                  <input
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    value={newRequest.estimatedBudget}
                    onChange={(event) =>
                      setNewRequest((prev) => ({ ...prev, estimatedBudget: event.target.value }))
                    }
                    placeholder="e.g. $5K - $10K"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Your Name / Org</label>
                  <input
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    value={newRequest.author}
                    onChange={(event) =>
                      setNewRequest((prev) => ({ ...prev, author: event.target.value }))
                    }
                    placeholder="Visible to potential contributors"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowNewRequestModal(false)}
                  className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePostRequest}
                  disabled={submittingRequest}
                  className={`rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors ${submittingRequest ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                >
                  {submittingRequest ? 'Submitting…' : 'Post Data Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
