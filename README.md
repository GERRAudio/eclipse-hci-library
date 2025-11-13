# Eclipse HCI Library

A TypeScript/Node.js library for communicating with Eclipse HX communication systems via the Host Control Interface (HCI) protocol.

## Features

### Core Functionality
- **HCI Protocol Support**: Full HCIv2 protocol implementation with backwards compatibility
- **Message Queue Management**: Automatic request queuing and response handling
- **Event-Driven Architecture**: Real-time event emission for all responses
- **Type Safety**: Complete TypeScript definitions for all data structures

### Supported Requests & Responses

#### Port Information
- **Request Port Info** (`0x0001`) - Get detailed port configuration and status
- **Reply Port Info** (`0x0002`) - Comprehensive port details including panel types, health status, and capabilities

#### Key Management
- **Request Locally Assigned Keys** (`0x00B9`) - Get all locally assigned key configurations
- **Reply Locally Assigned Keys** (`0x00BA`) - Complete key assignment details with operations and status

- **Request Assigned Keys** (`0x00E7`) - Get assigned key configurations (Schema v1 & v2)
- **Reply Assigned Keys** (`0x00E8`) - Key assignments with endpoint type support

#### Panel Status
- **Reply Panel Keys Status** - Real-time panel key status updates

#### System Information
- **Request Card Info** (`0x00C3`) - Get card information and health status
- **Reply Card Info** (`0x00C4`) - Detailed card health, types, versions, and port ranges

#### Conference & Group Management
- **Request Conference/Group Members Edits** (`0x00C5`) - Get locally edited conference/group members
- **Reply Conference Assignments** (`0x00C6`) - Conference member assignments with talk/listen permissions

### Data Structures

All protocol constants and enumerations are centralized in `/DataStructures/`:

#### Hardware & Configuration
- **Panel Types**: V-Series, ICS, CCI-22, FOR-22, Tel-14/SIP, LQ, Edge Beltpacks
- **Port Types**: Beltpack, Wireless, Trunk, Panel, Interface types
- **Card Types**: CPU Master/Slave, MVX, MADI, Fibre, EQUE/IVC32/LMC64
- **Slot Types**: CPU, DCC, Audio slots
- **Endpoint Types**: FS II/III, Edge Beltpacks
- **Expansion Panel Types**: Lever, Push, Rotary configurations

#### Operational States
- **Card Health**: PCB states (Good, Absent, Faulty, Initializing, etc.)
- **Key States**: OFF, ON, PARTIAL, RESERVED with visual indicators
- **Entity Types**: Port, Group, Trunk, Speed Dial, IFB, ISO, Conference, Page, System
- **Latch Modes**: Non-latch, Latch, Tri-state, Return modes with descriptions

#### Communication & Assignments
- **Edit Types**: Conference and Group edit operations
- **Edit Type Masks**: Talk, Listen, Local Delete/Assign, Map Assign, Override permissions
- **Key Interfaces**: Unified key configuration structure for consistent handling

### Advanced Features

#### Helper Functions
Each data structure includes comprehensive helper functions:
- **Name Resolution**: Convert numeric IDs to human-readable names
- **Validation**: Type safety and range checking
- **Categorization**: Group related items by function/type
- **Icon Representation**: Visual status indicators
- **Severity Assessment**: Health and error classification

#### Filtering & Analysis
- **Multi-level Filtering**: Filter data by region, page, type, status, health
- **Statistical Analysis**: Automatic calculation of summary statistics
- **Relationship Mapping**: Cross-reference keys, ports, cards, and assignments
- **Change Detection**: Identify local overrides and modifications

#### Display & Formatting
- **Rich Console Output**: Formatted tables and summaries with icons
- **Hierarchical Display**: Organized by region, page, conference, etc.
- **Status Indicators**: Color-coded health and operational status
- **Summary Statistics**: Automatic totals, breakdowns, and issue detection

## Installation

```bash
npm install eclipse-hci-library
```

## Quick Start

```typescript
import EclipseHCI from 'eclipse-hci-library';
import RequestPortInfo from 'eclipse-hci-library/Requests/RequestPortInfo';
import RequestCardInfo from 'eclipse-hci-library/Requests/RequestCardInfo';

// Create HCI client
const client = new EclipseHCI('192.168.1.100', 4001);

// Event handlers
client.on('onReplyPortInfo', (portInfo) => {
    console.log(`Port ${portInfo.portNumber}: ${portInfo.panelTypeName}`);
    console.log(`Health: ${portInfo.healthIcon} ${portInfo.healthStatus}`);
});

client.on('onReplyCardInfo', (cardInfo) => {
    cardInfo.cards.forEach(card => {
        console.log(`Card ${card.slotNumber}: ${card.currentCardTypeName}`);
        console.log(`Health: ${card.healthIcon} ${card.healthName}`);
    });
});

// Send requests
const portInfoRequest = RequestPortInfo.forSlot(5, 1);
const cardInfoRequest = RequestCardInfo.forSlot(3);

client.addToQueue(portInfoRequest);
client.addToQueue(cardInfoRequest);
```

## Advanced Usage

### Key Management

```typescript
import RequestLocallyAssignedKeys from 'eclipse-hci-library/Requests/RequestLocallyAssignedKeys';
import { getKeyStateName, getLatchModeName } from 'eclipse-hci-library/DataStructures';

// Request locally assigned keys
const keysRequest = RequestLocallyAssignedKeys.forPanel(5, 1);
client.addToQueue(keysRequest);

client.on('onReplyLocallyAssignedKeys', (keysData) => {
    // Filter keys by region
    const region1Keys = ReplyLocallyAssignedKeys.getKeysByRegion(keysData, 1);
    
    // Find specific key
    const key = ReplyLocallyAssignedKeys.findKeyByIdentifier(keysData, 'R1K5P0');
    
    if (key) {
        console.log(`Key ${key.keyIdentifier}:`);
        console.log(`  Entity: ${key.entityName}`);
        console.log(`  State: ${getKeyStateName(key.keyStatus.keyState)}`);
        console.log(`  Latch Mode: ${getLatchModeName(key.keyOperation.latchMode)}`);
    }
});
```

### Conference Management

```typescript
import RequestConferenceGroupMembersEdits, { EditType } from 'eclipse-hci-library/Requests/RequestConferenceGroupMembersEdits';

// Request conference member edits
const conferenceRequest = RequestConferenceGroupMembersEdits.forConference();
client.addToQueue(conferenceRequest);

client.on('onReplyConferenceAssignments', (assignments) => {
    // Check for local modifications
    const localOverrides = ReplyConferenceAssignments.getLocalOverrideAssignments(assignments);
    const localDeletes = ReplyConferenceAssignments.getLocalDeletedAssignments(assignments);
    
    if (localOverrides.length > 0) {
        console.warn(`${localOverrides.length} local overrides detected!`);
    }
    
    // Group by conference
    const byConference = ReplyConferenceAssignments.getAssignmentsByConference(assignments);
    Object.entries(byConference).forEach(([confNum, members]) => {
        const talkMembers = members.filter(m => m.editType.talk).length;
        console.log(`Conference ${confNum}: ${talkMembers} talk members`);
    });
});
```

### System Health Monitoring

```typescript
import RequestCardInfo from 'eclipse-hci-library/Requests/RequestCardInfo';
import { getCardHealthSeverity, isCardHealthy } from 'eclipse-hci-library/DataStructures';

// Monitor all cards
const allCardRequests = RequestCardInfo.forAllSlots(16);
allCardRequests.forEach(request => client.addToQueue(request));

client.on('onReplyCardInfo', (cardInfo) => {
    const stats = ReplyCardInfo.getCardStats(cardInfo);
    
    console.log(`System Health Summary:`);
    console.log(`  Total Cards: ${stats.totalCards}`);
    console.log(`  Healthy: ${stats.healthyCards} | Faulty: ${stats.faultyCards}`);
    console.log(`  Type Matches: ${stats.typeMatchCards}`);
    
    // Check for critical issues
    const faultyCards = ReplyCardInfo.getFaultyCards(cardInfo);
    if (faultyCards.length > 0) {
        console.error(`⚠️  ${faultyCards.length} cards need attention!`);
        faultyCards.forEach(card => {
            const severity = getCardHealthSeverity(card.health);
            console.error(`  Slot ${card.slotNumber}: ${card.healthDescription} [${severity}]`);
        });
    }
});
```

### Bulk Operations

```typescript
// Request multiple items efficiently
const requests = [
    ...RequestCardInfo.forSlotRange(1, 8),        // Cards 1-8
    ...RequestPortInfo.forSlotRange(5, 7),        // Ports on slots 5-7
    RequestLocallyAssignedKeys.forPanel(5, 1),     // Keys for panel
    RequestConferenceGroupMembersEdits.forBothTypes() // Both conference & group edits
].flat();

// Queue all requests
requests.forEach(request => client.addToQueue(request));

// Batch processing with Promise.all for synchronous operations
const results = await Promise.all([
    new Promise(resolve => client.once('onReplyCardInfo', resolve)),
    new Promise(resolve => client.once('onReplyPortInfo', resolve)),
    new Promise(resolve => client.once('onReplyLocallyAssignedKeys', resolve))
]);
```

## Data Structure Reference

### Import Patterns

```typescript
// Individual imports
import { 
    getCardHealthName, 
    getKeyStateName, 
    getLatchModeName,
    getPanelTypeName 
} from 'eclipse-hci-library/DataStructures';

// Category imports
import * from 'eclipse-hci-library/DataStructures/CardHealth';
import * from 'eclipse-hci-library/DataStructures/KeyStates';

// All data structures
import * as DataStructures from 'eclipse-hci-library/DataStructures';
```

### Validation & Safety

```typescript
import { 
    isValidCardHealth, 
    isValidKeyState, 
    isValidLatchMode,
    isCardHealthy 
} from 'eclipse-hci-library/DataStructures';

// Validate before processing
if (isValidCardHealth(health) && !isCardHealthy(health)) {
    console.warn(`Card health issue: ${getCardHealthName(health)}`);
}
```

## Architecture

### Request/Response Pattern
- All requests extend `HCIRequest` base class
- All responses are parsed by `HCIResponse` message router
- Automatic message ID routing and payload parsing
- Event emission for real-time handling

### Data Structure Organization
- Centralized constants in `/DataStructures/`
- Helper functions for every enumeration
- Consistent naming patterns across all modules
- Type safety with TypeScript definitions

### Error Handling
- Comprehensive validation at all levels
- Graceful degradation for unknown values
- Detailed error messages and logging
- Payload size and format validation

## Events

The library emits the following events:

- `onReplyPortInfo` - Port information received
- `onReplyLocallyAssignedKeys` - Locally assigned keys received
- `onReplyAssignedKeys` - Assigned keys received
- `onReplyPanelKeysStatus` - Panel key status update
- `onReplyCardInfo` - Card information received
- `onReplyConferenceAssignments` - Conference assignments received

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-message-type`)
3. Add your implementation following existing patterns
4. Update data structures in `/DataStructures/` as needed
5. Add comprehensive tests
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Version History

### v2.0.0 (Current)
- Complete data structure refactoring
- Centralized constants and enumerations
- Added Conference/Group management
- Card health monitoring
- Enhanced key management with unified interfaces
- Comprehensive helper functions and validation
- Rich display formatting with icons and summaries

### v1.x
- Initial HCI protocol implementation
- Basic request/response handling
- Port and key information support