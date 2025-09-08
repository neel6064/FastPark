// Smart Parking System JavaScript

// Application State
let appState = {
    currentScreen: 'dashboard',
    currentStep: 1,
    spots: [],
    selectedSpot: null,
    currentReservation: null,
    sessionSummary: null,
    sessionTimer: null,
    timeRemaining: 0,
    currentCost: 0,
    dynamicRate: 0,
    baseRate: 0
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    initializeApp();
    setupEventListeners();
});

// Initialize application
function initializeApp() {
    showScreen('dashboard');
    updateStep(1);
    loadParkingData();
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.getElementById('back-to-dashboard').addEventListener('click', () => {
        showScreen('dashboard');
        updateStep(1);
    });

    // Duration selection
    document.getElementById('duration-input').addEventListener('input', updateEstimatedCost);
    document.getElementById('check-availability-btn').addEventListener('click', checkAvailability);

    // Alternative spots
    document.getElementById('modify-duration-btn').addEventListener('click', () => {
        showReservationStep('duration');
    });

    // Confirmation
    document.getElementById('proceed-payment-btn').addEventListener('click', () => {
        if (validateUserInfo()) {
            showReservationStep('payment');
            updatePaymentSummary();
        }
    });

    // Payment
    document.getElementById('complete-payment-btn').addEventListener('click', () => {
        if (validatePaymentInfo()) {
            processPayment();
        }
    });

    // Session management
    document.getElementById('arrived-btn').addEventListener('click', startParkingSession);
    document.getElementById('end-session-btn').addEventListener('click', endSession);

    // Extensions
    document.querySelectorAll('.extension-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const duration = parseFloat(e.target.dataset.duration);
            requestExtension(duration);
        });
    });

    // Rating
    document.querySelectorAll('.star-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const rating = parseInt(e.target.dataset.rating);
            submitRating(rating);
        });
    });

    // New session
    document.getElementById('new-session-btn').addEventListener('click', () => {
        resetApp();
        showScreen('dashboard');
        updateStep(1);
    });
}

// Show screen
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(`${screenName}-screen`).classList.add('active');
    appState.currentScreen = screenName;
}

// Update progress step
function updateStep(step) {
    appState.currentStep = step;
    document.querySelectorAll('.step').forEach((stepEl, index) => {
        if (index + 1 <= step) {
            stepEl.classList.add('active');
        } else {
            stepEl.classList.remove('active');
        }
    });
}

// Load parking data (simulate API call)
function loadParkingData() {
    const loadingState = document.getElementById('loading-state');
    const dashboardContent = document.getElementById('dashboard-content');
    
    loadingState.classList.remove('hidden');
    dashboardContent.classList.add('hidden');

    // Simulate loading delay
    setTimeout(() => {
        // Generate mock parking spots
        appState.spots = generateMockSpots();
        
        loadingState.classList.add('hidden');
        dashboardContent.classList.remove('hidden');
        
        updateDashboard();
        
        // Set up periodic updates
        setInterval(updateParkingData, 30000); // Update every 30 seconds
    }, 1000);
}

// Generate mock parking spots
function generateMockSpots() {
    const spots = [];
    const levels = ['Level 1', 'Level 2'];
    const sections = ['A', 'B', 'C'];
    const rates = [5, 6, 7];
    
    let spotId = 1;
    
    levels.forEach((level, levelIndex) => {
        sections.forEach((section, sectionIndex) => {
            for (let i = 1; i <= 3; i++) {
                const id = `${section}${i}`;
                const rate = rates[sectionIndex];
                const isAvailable = Math.random() > 0.4;
                const isReserved = isAvailable && Math.random() > 0.8;
                const timeLeft = isReserved ? Math.floor(Math.random() * 60) + 15 : null;
                
                spots.push({
                    id,
                    level,
                    section,
                    isAvailable,
                    isReserved,
                    timeLeft,
                    rate
                });
                spotId++;
            }
        });
    });
    
    return spots;
}

// Update parking data (simulate real-time updates)
function updateParkingData() {
    appState.spots = appState.spots.map(spot => {
        // Randomly update spot availability
        if (Math.random() > 0.9) {
            return {
                ...spot,
                isAvailable: !spot.isAvailable,
                isReserved: false,
                timeLeft: null
            };
        }
        
        // Update reserved time
        if (spot.isReserved && spot.timeLeft > 0) {
            return {
                ...spot,
                timeLeft: Math.max(0, spot.timeLeft - 1)
            };
        }
        
        return spot;
    });
    
    if (appState.currentScreen === 'dashboard') {
        updateDashboard();
    }
}

// Update dashboard
function updateDashboard() {
    updateStats();
    updateAvailableSpots();
    updateLotOverview();
}

// Update statistics
function updateStats() {
    const available = appState.spots.filter(spot => spot.isAvailable && !spot.isReserved);
    const occupied = appState.spots.filter(spot => !spot.isAvailable);
    const reserved = appState.spots.filter(spot => spot.isReserved);
    const total = appState.spots.length;
    
    document.getElementById('available-count').textContent = available.length;
    document.getElementById('occupied-count').textContent = occupied.length;
    document.getElementById('reserved-count').textContent = reserved.length;
    document.getElementById('total-count').textContent = total;
}

// Update available spots
function updateAvailableSpots() {
    const availableSpots = appState.spots.filter(spot => spot.isAvailable && !spot.isReserved);
    const container = document.getElementById('available-spots');
    const noSpotsMsg = document.getElementById('no-spots');
    
    if (availableSpots.length === 0) {
        container.classList.add('hidden');
        noSpotsMsg.classList.remove('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    noSpotsMsg.classList.add('hidden');
    
    container.innerHTML = availableSpots.map(spot => `
        <div class="spot-card">
            <div class="spot-header">
                <div class="spot-info">
                    <div class="spot-status available"></div>
                    <span class="spot-name">Spot ${spot.id}</span>
                </div>
                <span class="badge available">Available</span>
            </div>
            <p class="spot-location">${spot.level}, Section ${spot.section}</p>
            <div class="spot-footer">
                <span class="spot-rate">$${spot.rate}/hour</span>
                <button class="btn btn-primary" onclick="selectSpot('${spot.id}')">Select</button>
            </div>
        </div>
    `).join('');
}

// Update lot overview
function updateLotOverview() {
    const container = document.getElementById('lot-overview');
    
    container.innerHTML = appState.spots.map(spot => {
        const status = getSpotStatus(spot);
        const statusClass = status === 'available' ? 'available' : 
                           status === 'occupied' ? 'occupied' : 'reserved';
        const onclick = status === 'available' ? `onclick="selectSpot('${spot.id}')"` : '';
        
        return `
            <div class="lot-spot ${statusClass}" ${onclick}>
                <div>${spot.id}</div>
                ${spot.timeLeft ? `<div class="lot-spot-time">${spot.timeLeft}m</div>` : ''}
            </div>
        `;
    }).join('');
}

// Get spot status
function getSpotStatus(spot) {
    if (!spot.isAvailable) return 'occupied';
    if (spot.isReserved) return 'reserved';
    return 'available';
}

// Select a parking spot
function selectSpot(spotId) {
    const spot = appState.spots.find(s => s.id === spotId);
    if (!spot || !spot.isAvailable || spot.isReserved) return;
    
    appState.selectedSpot = spot;
    showScreen('reservation');
    updateStep(2);
    showReservationStep('duration');
    updateSelectedSpotInfo();
    updateEstimatedCost();
}

// Show reservation step
function showReservationStep(step) {
    document.querySelectorAll('.reservation-step').forEach(stepEl => {
        stepEl.classList.add('hidden');
    });
    document.getElementById(`${step}-step`).classList.remove('hidden');
}

// Update selected spot info
function updateSelectedSpotInfo() {
    const container = document.getElementById('selected-spot-info');
    const spot = appState.selectedSpot;
    
    container.innerHTML = `
        <div class="spot-info-header">
            <span class="spot-info-name">Selected Spot: ${spot.id}</span>
            <span class="badge available">$${spot.rate}/hour</span>
        </div>
        <p class="spot-info-location">${spot.level}, Section ${spot.section}</p>
    `;
}

// Update estimated cost
function updateEstimatedCost() {
    const duration = parseInt(document.getElementById('duration-input').value) || 0;
    const cost = appState.selectedSpot ? appState.selectedSpot.rate * duration : 0;
    document.getElementById('estimated-cost').textContent = `$${cost}`;
}

// Check availability for selected duration
function checkAvailability() {
    const duration = parseInt(document.getElementById('duration-input').value);
    if (duration < 1) {
        alert('Please enter a valid duration (at least 1 hour)');
        return;
    }
    
    // Simulate availability check
    setTimeout(() => {
        const isAvailable = Math.random() > 0.3; // 70% chance of availability
        
        if (isAvailable) {
            showReservationStep('confirmation');
            updateReservationSummary();
        } else {
            showReservationStep('alternative');
            generateAlternativeSpots();
        }
    }, 1000);
}

// Generate alternative spots
function generateAlternativeSpots() {
    const availableSpots = appState.spots.filter(spot => 
        spot.isAvailable && !spot.isReserved && spot.id !== appState.selectedSpot.id
    ).slice(0, 3);
    
    const container = document.getElementById('alternative-spots');
    const duration = parseInt(document.getElementById('duration-input').value);
    
    container.innerHTML = availableSpots.map(spot => `
        <div class="alternative-spot" onclick="selectAlternativeSpot('${spot.id}')">
            <div class="alternative-spot-header">
                <div class="alternative-spot-info">
                    <div class="alternative-spot-name">
                        <i data-lucide="map-pin"></i>
                        <span>Spot ${spot.id}</span>
                        <span class="badge available">Available</span>
                    </div>
                    <p>${spot.level}, Section ${spot.section}</p>
                    <p>$${spot.rate}/hour × ${duration}h = $${spot.rate * duration}</p>
                </div>
                <button class="btn btn-primary">Select</button>
            </div>
        </div>
    `).join('');
    
    // Recreate icons
    lucide.createIcons();
}

// Select alternative spot
function selectAlternativeSpot(spotId) {
    const spot = appState.spots.find(s => s.id === spotId);
    appState.selectedSpot = spot;
    showReservationStep('confirmation');
    updateReservationSummary();
}

// Update reservation summary
function updateReservationSummary() {
    const spot = appState.selectedSpot;
    const duration = parseInt(document.getElementById('duration-input').value);
    const cost = spot.rate * duration;
    
    const container = document.getElementById('reservation-summary');
    container.innerHTML = `
        <div class="summary-header">
            <i data-lucide="check-circle"></i>
            <span>Spot Reserved</span>
        </div>
        <div class="summary-grid">
            <div class="summary-item">
                <span class="summary-label">Spot:</span>
                <span class="summary-value">${spot.id}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Location:</span>
                <span class="summary-value">${spot.level}, Section ${spot.section}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Duration:</span>
                <span class="summary-value">${duration} hours</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Rate:</span>
                <span class="summary-value">$${spot.rate}/hour</span>
            </div>
        </div>
    `;
    
    document.getElementById('final-cost').textContent = `$${cost}`;
    
    // Recreate icons
    lucide.createIcons();
}

// Validate user information
function validateUserInfo() {
    const name = document.getElementById('user-name').value.trim();
    const email = document.getElementById('user-email').value.trim();
    const plate = document.getElementById('vehicle-plate').value.trim();
    
    if (!name || !email || !plate) {
        alert('Please fill in all required fields');
        return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return false;
    }
    
    return true;
}

// Update payment summary
function updatePaymentSummary() {
    const spot = appState.selectedSpot;
    const duration = parseInt(document.getElementById('duration-input').value);
    const cost = spot.rate * duration;
    const total = cost + 0.50;
    
    document.getElementById('payment-description').textContent = `Spot ${spot.id} - ${duration} hours`;
    document.getElementById('payment-amount').textContent = `$${cost}`;
    document.getElementById('payment-total').textContent = `$${total.toFixed(2)}`;
}

// Validate payment information
function validatePaymentInfo() {
    const cardNumber = document.getElementById('card-number').value.trim();
    const nameOnCard = document.getElementById('name-on-card').value.trim();
    const expiryDate = document.getElementById('expiry-date').value.trim();
    const cvv = document.getElementById('cvv').value.trim();
    
    if (!cardNumber || !nameOnCard || !expiryDate || !cvv) {
        alert('Please fill in all payment fields');
        return false;
    }
    
    return true;
}

// Process payment
function processPayment() {
    showReservationStep('payment-processing');
    
    // Simulate payment processing
    setTimeout(() => {
        const reservation = {
            spotId: appState.selectedSpot.id,
            duration: parseInt(document.getElementById('duration-input').value),
            cost: appState.selectedSpot.rate * parseInt(document.getElementById('duration-input').value),
            userDetails: {
                name: document.getElementById('user-name').value,
                email: document.getElementById('user-email').value,
                phone: document.getElementById('user-phone').value,
                vehiclePlate: document.getElementById('vehicle-plate').value
            },
            timestamp: new Date(),
            confirmationNumber: generateConfirmationNumber()
        };
        
        appState.currentReservation = reservation;
        showReservationStep('complete');
        updateConfirmationDetails();
        
        // Auto-proceed to session after 3 seconds
        setTimeout(() => {
            showScreen('session');
            updateStep(3);
            initializeSession();
        }, 3000);
    }, 2000);
}

// Generate confirmation number
function generateConfirmationNumber() {
    return 'PKG' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Update confirmation details
function updateConfirmationDetails() {
    const reservation = appState.currentReservation;
    const container = document.getElementById('confirmation-details');
    
    container.innerHTML = `
        <div class="summary-item">
            <span class="summary-label">Spot:</span>
            <span class="summary-value">${reservation.spotId}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Location:</span>
            <span class="summary-value">${appState.selectedSpot.level}, Section ${appState.selectedSpot.section}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Duration:</span>
            <span class="summary-value">${reservation.duration} hours</span>
        </div>
    `;
}

// Initialize parking session
function initializeSession() {
    const reservation = appState.currentReservation;
    document.getElementById('session-subtitle').textContent = 
        `Spot ${reservation.spotId} - ${reservation.userDetails.vehiclePlate}`;
    
    showSessionState('arriving');
    
    // Auto-detect arrival after 5 seconds (simulation)
    setTimeout(() => {
        if (appState.currentScreen === 'session') {
            startParkingSession();
        }
    }, 5000);
}

// Show session state
function showSessionState(state) {
    document.querySelectorAll('.session-state').forEach(stateEl => {
        stateEl.classList.remove('active');
    });
    document.getElementById(`${state}-state`).classList.add('active');
    
    // Update header
    const title = document.getElementById('session-status-title');
    const icon = title.querySelector('i');
    
    switch (state) {
        case 'arriving':
            icon.setAttribute('data-lucide', 'navigation');
            title.innerHTML = '<i data-lucide="navigation"></i> En Route to Parking Spot';
            break;
        case 'parked':
            icon.setAttribute('data-lucide', 'car');
            title.innerHTML = '<i data-lucide="car"></i> Vehicle Parked';
            break;
        case 'extending':
            icon.setAttribute('data-lucide', 'clock');
            title.innerHTML = '<i data-lucide="clock"></i> Processing Extension';
            break;
    }
    
    lucide.createIcons();
}

// Start parking session
function startParkingSession() {
    showSessionState('parked');
    
    const reservation = appState.currentReservation;
    appState.timeRemaining = reservation.duration * 60; // Convert to minutes
    appState.currentCost = 0;
    appState.baseRate = reservation.cost / reservation.duration;
    appState.dynamicRate = appState.baseRate;
    
    updateSessionDisplay();
    startSessionTimer();
}

// Start session timer
function startSessionTimer() {
    if (appState.sessionTimer) {
        clearInterval(appState.sessionTimer);
    }
    
    appState.sessionTimer = setInterval(() => {
        if (appState.timeRemaining > 0) {
            appState.timeRemaining--;
            
            // Update dynamic rate (simulate fluctuations)
            appState.dynamicRate = appState.baseRate + (Math.random() - 0.5) * 0.5;
            appState.dynamicRate = Math.max(1, appState.dynamicRate);
            
            // Update current cost
            const timeElapsed = (appState.currentReservation.duration * 60) - appState.timeRemaining;
            appState.currentCost = (timeElapsed / 60) * appState.baseRate;
            
            updateSessionDisplay();
            
            // Show warning when time is low
            if (appState.timeRemaining <= 30) {
                document.getElementById('time-warning').classList.remove('hidden');
            }
            
            // Auto-end session when time expires
            if (appState.timeRemaining <= 0) {
                endSession();
            }
        }
    }, 60000); // Update every minute (for demo, using seconds)
    
    // For demo purposes, update every second
    appState.sessionTimer = setInterval(() => {
        if (appState.timeRemaining > 0) {
            appState.timeRemaining--;
            
            // Update dynamic rate (simulate fluctuations)
            appState.dynamicRate = appState.baseRate + (Math.random() - 0.5) * 0.5;
            appState.dynamicRate = Math.max(1, appState.dynamicRate);
            
            // Update current cost
            const timeElapsed = (appState.currentReservation.duration * 60) - appState.timeRemaining;
            appState.currentCost = (timeElapsed / 60) * appState.baseRate;
            
            updateSessionDisplay();
            
            // Show warning when time is low
            if (appState.timeRemaining <= 30) {
                document.getElementById('time-warning').classList.remove('hidden');
            }
            
            // Auto-end session when time expires
            if (appState.timeRemaining <= 0) {
                endSession();
            }
        }
    }, 1000); // Demo: Update every second
}

// Update session display
function updateSessionDisplay() {
    const reservation = appState.currentReservation;
    
    // Update session stats
    document.getElementById('current-spot').textContent = reservation.spotId;
    document.getElementById('time-remaining').textContent = formatTime(appState.timeRemaining);
    document.getElementById('current-rate').textContent = `$${appState.dynamicRate.toFixed(2)}/hr`;
    document.getElementById('session-cost').textContent = `$${appState.currentCost.toFixed(2)}`;
    
    // Update progress
    const totalMinutes = reservation.duration * 60;
    const progress = ((totalMinutes - appState.timeRemaining) / totalMinutes) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;
    document.getElementById('progress-percentage').textContent = `${Math.round(progress)}% complete`;
    
    // Update pricing
    document.getElementById('base-rate').textContent = `$${appState.baseRate.toFixed(2)}/hour`;
    document.getElementById('dynamic-rate').textContent = `$${appState.dynamicRate.toFixed(2)}/hour`;
    document.getElementById('time-used').textContent = formatTime((reservation.duration * 60) - appState.timeRemaining);
    document.getElementById('current-total').textContent = `$${appState.currentCost.toFixed(2)}`;
}

// Format time (minutes to hours:minutes)
function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

// Request extension
function requestExtension(additionalHours) {
    showSessionState('extending');
    
    const extensionMessage = document.getElementById('extension-message');
    extensionMessage.textContent = `Checking availability for ${additionalHours} additional hour(s)...`;
    
    // Disable extension buttons
    document.querySelectorAll('.extension-btn').forEach(btn => {
        btn.disabled = true;
    });
    
    // Simulate extension processing
    setTimeout(() => {
        const available = Math.random() > 0.2; // 80% chance of approval
        
        if (available) {
            appState.timeRemaining += additionalHours * 60;
            showSessionState('parked');
            
            // Re-enable extension buttons
            document.querySelectorAll('.extension-btn').forEach(btn => {
                btn.disabled = false;
            });
        } else {
            alert('Extension unavailable. Another user has reserved this spot. Please move your vehicle within 10 minutes to avoid penalty charges.');
            setTimeout(() => {
                endSession();
            }, 10000);
        }
    }, 2000);
}

// End parking session
function endSession() {
    if (appState.sessionTimer) {
        clearInterval(appState.sessionTimer);
    }
    
    const reservation = appState.currentReservation;
    const actualDuration = ((reservation.duration * 60) - appState.timeRemaining) / 60;
    const overtimePenalty = actualDuration > reservation.duration ? 
        (actualDuration - reservation.duration) * 10 : 0;
    
    appState.sessionSummary = {
        spotId: reservation.spotId,
        duration: reservation.duration,
        actualDuration: actualDuration,
        finalCost: appState.currentCost,
        overtimePenalty: overtimePenalty,
        userDetails: reservation.userDetails,
        checkIn: new Date(Date.now() - ((reservation.duration * 60 - appState.timeRemaining) * 60000)),
        checkOut: new Date(),
        confirmationNumber: reservation.confirmationNumber
    };
    
    showScreen('summary');
    updateStep(4);
    updateSummaryDisplay();
}

// Update summary display
function updateSummaryDisplay() {
    const summary = appState.sessionSummary;
    
    // Update summary details
    const detailsContainer = document.getElementById('summary-details');
    detailsContainer.innerHTML = `
        <div class="detail-section">
            <div class="detail-item">
                <i data-lucide="map-pin"></i>
                <div>
                    <span class="detail-label">Parking Spot</span>
                    <span class="detail-value">${summary.spotId}</span>
                </div>
            </div>
            <div class="detail-item">
                <i data-lucide="car"></i>
                <div>
                    <span class="detail-label">Vehicle</span>
                    <span class="detail-value">${summary.userDetails.vehiclePlate}</span>
                </div>
            </div>
            <div class="detail-item">
                <i data-lucide="clock"></i>
                <div>
                    <span class="detail-label">Duration</span>
                    <span class="detail-value">
                        Reserved: ${formatTime(summary.duration * 60)}
                        ${summary.actualDuration !== summary.duration ? 
                            `<span style="color: #6b7280; font-size: 0.875rem;"> (Actual: ${formatTime(summary.actualDuration * 60)})</span>` : ''
                        }
                    </span>
                </div>
            </div>
        </div>
        <div class="detail-section">
            <div class="detail-item">
                <span class="detail-label">Check-in Time</span>
                <span class="detail-value">${formatDateTime(summary.checkIn)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Check-out Time</span>
                <span class="detail-value">${formatDateTime(summary.checkOut)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Confirmation Number</span>
                <span class="detail-value confirmation-number">${summary.confirmationNumber}</span>
            </div>
        </div>
    `;
    
    // Update cost breakdown
    const costContainer = document.getElementById('cost-breakdown');
    const processingFee = 0.50;
    const total = summary.finalCost + processingFee + summary.overtimePenalty;
    
    let costHTML = `
        <div class="cost-line">
            <span>Parking Duration (${formatTime(summary.actualDuration * 60)})</span>
            <span>$${summary.finalCost.toFixed(2)}</span>
        </div>
        <div class="cost-line">
            <span>Processing Fee</span>
            <span>$${processingFee.toFixed(2)}</span>
        </div>
    `;
    
    if (summary.overtimePenalty > 0) {
        costHTML += `
            <div class="cost-line penalty">
                <span>Overtime Penalty</span>
                <span>$${summary.overtimePenalty.toFixed(2)}</span>
            </div>
        `;
    }
    
    costHTML += `
        <div class="cost-line total">
            <span>Total Amount</span>
            <span>$${total.toFixed(2)}</span>
        </div>
    `;
    
    costContainer.innerHTML = costHTML;
    
    // Show overtime warning if applicable
    if (summary.actualDuration > summary.duration) {
        document.getElementById('overtime-warning').classList.remove('hidden');
    }
    
    // Update receipt status
    setTimeout(() => {
        const receiptStatus = document.getElementById('receipt-status');
        receiptStatus.innerHTML = `
            <i data-lucide="check-circle"></i>
            <p>Receipt has been sent to ${summary.userDetails.email} and via SMS to your registered phone number.</p>
        `;
        receiptStatus.className = 'alert alert-info';
    }, 2000);
    
    // Update confirmation reference
    document.getElementById('confirmation-reference').textContent = summary.confirmationNumber;
    
    // Recreate icons
    lucide.createIcons();
}

// Format date and time
function formatDateTime(date) {
    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(new Date(date));
}

// Submit rating
function submitRating(rating) {
    // Update star display
    document.querySelectorAll('.star-btn').forEach((btn, index) => {
        if (index < rating) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Show feedback message
    const feedbackThanks = document.getElementById('feedback-thanks');
    feedbackThanks.innerHTML = `
        <i data-lucide="check-circle"></i>
        <p>Thank you for your feedback! Your ${rating}-star rating helps us improve our service.</p>
    `;
    feedbackThanks.classList.remove('hidden');
    
    // Recreate icons
    lucide.createIcons();
}

// Reset app state
function resetApp() {
    appState = {
        currentScreen: 'dashboard',
        currentStep: 1,
        spots: appState.spots, // Keep existing spots
        selectedSpot: null,
        currentReservation: null,
        sessionSummary: null,
        sessionTimer: null,
        timeRemaining: 0,
        currentCost: 0,
        dynamicRate: 0,
        baseRate: 0
    };
    
    if (appState.sessionTimer) {
        clearInterval(appState.sessionTimer);
    }
    
    // Reset forms
    document.querySelectorAll('input').forEach(input => {
        if (input.type !== 'number' || input.id !== 'duration-input') {
            input.value = '';
        }
    });
    
    document.getElementById('duration-input').value = '1';
    
    // Reset UI elements
    document.getElementById('time-warning').classList.add('hidden');
    document.getElementById('overtime-warning').classList.add('hidden');
    document.getElementById('feedback-thanks').classList.add('hidden');
    
    document.querySelectorAll('.star-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.extension-btn').forEach(btn => {
        btn.disabled = false;
    });
    
    // Refresh parking data
    updateDashboard();
}

// Utility functions for demo purposes
function simulateArrival() {
    if (appState.currentScreen === 'session') {
        startParkingSession();
    }
}

function simulateExtension(hours) {
    requestExtension(hours);
}

function simulateSessionEnd() {
    endSession();
}

// Make functions available globally for debugging
window.appState = appState;
window.simulateArrival = simulateArrival;
window.simulateExtension = simulateExtension;
window.simulateSessionEnd = simulateSessionEnd;