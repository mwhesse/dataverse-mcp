# Comprehensive MCP Dataverse Server Test Plan

## Overview
This document outlines a comprehensive testing plan for all MCP Dataverse server tools. The test will create a complete "Pet Store" schema with all supported column types, relationship types, and security configurations.

## Test Environment Setup
- **Publisher**: `petstorepublisher` with prefix `pets`
- **Solution**: `petstoresolution`
- **Theme**: Pet Store management system

## Phase 1: Foundation Setup

### 1.1 Publisher & Solution Setup
- [ ] Create publisher with "pets" prefix and option value prefix 50000
- [ ] Create solution linked to publisher
- [ ] Set solution context for all subsequent operations
- [ ] Verify context persistence

### 1.2 Initial Verification
- [ ] List existing publishers
- [ ] List existing solutions
- [ ] Get solution context
- [ ] Test context file creation

## Phase 2: Core Schema Creation

### 2.1 Table Creation Tests
Create the following tables to test various scenarios:

#### Primary Tables
- [ ] **pets_animal** - Main animal/pet table
- [ ] **pets_customer** - Customer information
- [ ] **pets_order** - Purchase orders
- [ ] **pets_supplier** - Supplier information
- [ ] **pets_category** - Animal categories
- [ ] **pets_veterinarian** - Vet information
- [ ] **pets_appointment** - Vet appointments
- [ ] **pets_inventory** - Inventory tracking

#### Test Table Properties
- [ ] Test different ownership types (UserOwned, OrganizationOwned)
- [ ] Test tables with activities enabled
- [ ] Test tables with notes enabled
- [ ] Test audit enabled tables
- [ ] Test duplicate detection enabled tables

### 2.2 Column Type Testing
Test all supported column types on the `pets_animal` table:

#### String Columns
- [ ] **pets_name** - Text format, max 100 chars, required
- [ ] **pets_description** - TextArea format, max 2000 chars
- [ ] **pets_email** - Email format, max 100 chars
- [ ] **pets_website** - Url format, max 200 chars
- [ ] **pets_phone** - Phone format, max 50 chars

#### Numeric Columns
- [ ] **pets_age** - Integer, min 0, max 50, default 1
- [ ] **pets_weight** - Decimal, precision 2, min 0.1, max 500.0
- [ ] **pets_price** - Money, precision 2, min 0, max 10000
- [ ] **pets_height** - Double, min 0.1, max 200.0
- [ ] **pets_microchipid** - BigInt for large ID numbers

#### Other Column Types
- [ ] **pets_isavailable** - Boolean, "Available"/"Sold", default true
- [ ] **pets_birthdate** - DateTime (DateOnly)
- [ ] **pets_lastcheckup** - DateTime (DateAndTime)
- [ ] **pets_notes** - Memo, max 4000 chars

#### Picklist Columns
- [ ] **pets_status** - Local picklist (Available, Reserved, Sold, Adopted)
- [ ] **pets_size** - Global option set reference
- [ ] **pets_color** - Global option set with colors

#### Lookup Columns
- [ ] **pets_customerid** - Lookup to pets_customer
- [ ] **pets_categoryid** - Lookup to pets_category
- [ ] **pets_veterinarianid** - Lookup to pets_veterinarian

### 2.3 Option Set Testing
Create comprehensive option sets:

#### Global Option Sets
- [ ] **pets_animalsize** - Small, Medium, Large, Extra Large
- [ ] **pets_animalcolor** - Various colors with hex codes
- [ ] **pets_orderstatus** - Pending, Confirmed, Shipped, Delivered, Cancelled
- [ ] **pets_priority** - Low, Medium, High, Critical

#### Option Set Operations
- [ ] Create option sets with colors
- [ ] Update option sets (add/update/remove options)
- [ ] Get option set metadata
- [ ] Get option set options
- [ ] List option sets with filtering

## Phase 3: Relationship Testing

### 3.1 One-to-Many Relationships
- [ ] **pets_customer_animal** - Customer to Animals (1:N)
- [ ] **pets_category_animal** - Category to Animals (1:N)
- [ ] **pets_customer_order** - Customer to Orders (1:N)
- [ ] **pets_supplier_inventory** - Supplier to Inventory (1:N)
- [ ] **pets_veterinarian_appointment** - Vet to Appointments (1:N)

#### Cascade Behavior Testing
- [ ] Test RemoveLink cascade delete
- [ ] Test Cascade delete behavior
- [ ] Test NoCascade behavior
- [ ] Test different assign/merge/share behaviors

### 3.2 Many-to-Many Relationships
- [ ] **pets_animal_veterinarian** - Animals can have multiple vets
- [ ] **pets_order_inventory** - Orders can contain multiple inventory items
- [ ] **pets_customer_category** - Customer preferences for categories

#### M:N Relationship Features
- [ ] Custom intersect entity names
- [ ] Menu behavior configuration
- [ ] Advanced Find visibility

### 3.3 Relationship Operations
- [ ] Get relationship metadata
- [ ] List relationships with filtering
- [ ] Test relationship deletion

## Phase 4: Security & Access Control

### 4.1 Security Role Testing
Create comprehensive security roles:

#### Custom Roles
- [ ] **Pet Store Manager** - Full access role
- [ ] **Pet Store Employee** - Limited access role
- [ ] **Veterinarian** - Vet-specific permissions
- [ ] **Customer Service** - Customer interaction role

#### Role Operations
- [ ] Create roles with different inheritance settings
- [ ] Update role properties
- [ ] Get role information
- [ ] List roles with filtering

### 4.2 Role Privilege Management
- [ ] Add privileges to roles with different depths (Basic, Local, Deep, Global)
- [ ] Remove privileges from roles
- [ ] Replace role privileges completely
- [ ] Get role privileges

### 4.3 Team Management
Create and test teams:

#### Team Types
- [ ] **Pet Store Management** - Owner team
- [ ] **Veterinary Staff** - Access team
- [ ] **Customer Service** - Owner team
- [ ] **Inventory Team** - Access team

#### Team Operations
- [ ] Create teams with different types and membership settings
- [ ] Update team properties
- [ ] Add/remove team members
- [ ] Get team members
- [ ] Convert owner team to access team
- [ ] Assign roles to teams

### 4.4 Business Unit Testing
- [ ] Create **Pet Store Division** business unit
- [ ] Create **Veterinary Services** sub-unit
- [ ] Test business unit hierarchy
- [ ] Set parent-child relationships
- [ ] Get business unit users and teams
- [ ] Update business unit properties

## Phase 5: Advanced Features

### 5.1 Schema Export Testing
Test various export configurations:

#### Basic Exports
- [ ] Export custom schema only (default)
- [ ] Export with system tables included
- [ ] Export with system columns included
- [ ] Export with system option sets included

#### Advanced Filtering
- [ ] Export with customization prefix filtering
- [ ] Export with column prefix exclusion
- [ ] Export with specific system tables
- [ ] Export minified vs prettified JSON

### 5.2 Mermaid Diagram Generation
- [ ] Generate diagram from exported schema
- [ ] Test with/without columns
- [ ] Test with/without relationships
- [ ] Test with table name filtering
- [ ] Verify diagram accuracy

### 5.3 WebAPI Call Generation
Test all operation types:

#### CRUD Operations
- [ ] Generate retrieve calls
- [ ] Generate retrieveMultiple with filtering
- [ ] Generate create calls with data
- [ ] Generate update calls with If-Match
- [ ] Generate delete calls

#### Advanced Operations
- [ ] Generate associate relationship calls
- [ ] Generate disassociate calls
- [ ] Generate bound action calls
- [ ] Generate unbound function calls
- [ ] Test with solution context headers

### 5.4 PowerPages Integration
- [ ] Generate PowerPages WebAPI calls
- [ ] Test PowerPages configuration management
- [ ] Add WebAPI configurations
- [ ] Add table permissions
- [ ] Test configuration status checking

### 5.5 Resource Access Testing
- [ ] Test WebAPI resource templates
- [ ] Test PowerPages resource templates
- [ ] Test direct resource access
- [ ] Verify resource content accuracy

## Phase 6: Update & Modification Testing

### 6.1 Entity Updates
- [ ] Update table properties
- [ ] Update column properties
- [ ] Update option set options
- [ ] Update security role properties
- [ ] Update team properties
- [ ] Update business unit properties

### 6.2 Relationship Modifications
- [ ] Test relationship property updates (if supported)
- [ ] Test cascade behavior changes

## Phase 7: Deletion & Cleanup Testing

### 7.1 Systematic Deletion
Test deletion in proper order to avoid dependency issues:

#### Phase 7.1.1: Relationship Cleanup
- [ ] Delete Many-to-Many relationships
- [ ] Delete One-to-Many relationships

#### Phase 7.1.2: Column Cleanup
- [ ] Delete lookup columns
- [ ] Delete picklist columns
- [ ] Delete other custom columns

#### Phase 7.1.3: Schema Cleanup
- [ ] Delete custom tables
- [ ] Delete option sets
- [ ] Delete security roles
- [ ] Delete teams
- [ ] Delete business units (except root)

#### Phase 7.1.4: Solution Cleanup
- [ ] Clear solution context
- [ ] Verify context file removal

### 7.2 Error Handling Tests
- [ ] Test deletion of referenced entities (should fail)
- [ ] Test deletion of non-existent entities
- [ ] Test invalid parameter handling
- [ ] Test authentication failures
- [ ] Test permission denied scenarios

## Phase 8: Edge Cases & Error Scenarios

### 8.1 Boundary Testing
- [ ] Test maximum string lengths
- [ ] Test numeric boundary values
- [ ] Test maximum option set options
- [ ] Test complex relationship scenarios

### 8.2 Invalid Input Testing
- [ ] Test invalid entity names
- [ ] Test invalid column types
- [ ] Test invalid relationship configurations
- [ ] Test malformed option set data

### 8.3 Concurrency Testing
- [ ] Test simultaneous operations
- [ ] Test context switching
- [ ] Test solution context conflicts

## Phase 9: Performance & Reliability

### 9.1 Large Dataset Testing
- [ ] Create tables with many columns
- [ ] Create option sets with many options
- [ ] Test bulk operations
- [ ] Test export performance with large schemas

### 9.2 Reliability Testing
- [ ] Test server restart scenarios
- [ ] Test context persistence
- [ ] Test error recovery
- [ ] Test timeout handling

## Phase 10: Documentation & Reporting

### 10.1 Test Results Documentation
- [ ] Document all successful operations
- [ ] Document any bugs found and fixes applied
- [ ] Document performance observations
- [ ] Document best practices discovered

### 10.2 Final Verification
- [ ] Verify all tools tested
- [ ] Verify all column types tested
- [ ] Verify all relationship types tested
- [ ] Verify all security features tested
- [ ] Generate comprehensive test report

## Success Criteria

### Functional Requirements
- ✅ All 60+ MCP tools function correctly
- ✅ All column types create and behave properly
- ✅ All relationship types work as expected
- ✅ Security features function correctly
- ✅ Schema export captures all entities
- ✅ WebAPI generation produces valid calls
- ✅ PowerPages integration works properly

### Quality Requirements
- ✅ No data corruption during operations
- ✅ Proper error handling for invalid inputs
- ✅ Context persistence works reliably
- ✅ All cleanup operations complete successfully
- ✅ Performance is acceptable for typical use cases

### Documentation Requirements
- ✅ All bugs found are documented and fixed
- ✅ Test results are comprehensively documented
- ✅ Best practices are identified and documented
- ✅ Any limitations are clearly documented

## Test Execution Notes

### Environment Requirements
- Valid Dataverse environment with admin permissions
- Proper authentication credentials configured
- Clean environment (or ability to clean up test data)

### Execution Strategy
- Execute tests in phases to maintain organization
- Document results after each phase
- Fix bugs immediately when found
- Maintain detailed logs of all operations

### Risk Mitigation
- Take schema backups before major operations
- Test deletion operations on non-critical data first
- Have rollback procedures ready
- Monitor system performance during testing

---

**Test Plan Version**: 1.0  
**Created**: 2025-01-09  
**Status**: Ready for Execution