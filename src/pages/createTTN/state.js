// Shared state for Create TTN page

export const state = {
    // Sender
    senderRef: '',
    senderContactRef: '',
    senderCityRef: '',
    senderCityName: '',
    senderAddressRef: '',
    senderPhone: '',

    // Recipient
    recipientType: 'PrivatePerson', // PrivatePerson | Organization
    recipientRef: '',
    recipientContactRef: '',
    recipientCityRef: '',
    recipientCityName: '',
    recipientAddressRef: '',
    recipientPhone: '',

    // Delivery
    serviceType: 'WarehouseWarehouse',
    payerType: 'Recipient',
    paymentMethod: 'Cash',
    cargoType: 'Parcel',

    // Cargo
    weight: '1',
    seatsAmount: '1',
    cost: '300',
    description: '',

    // Dimensions
    volumetricWidth: '',
    volumetricLength: '',
    volumetricHeight: '',

    // Backward delivery
    backwardDeliveryEnabled: false,
    backwardDeliveryType: 'Money',
    backwardDeliveryValue: '',

    // Additional
    dateTime: '',
    note: '',
};

// Autocomplete instances storage
export const autocompletes = {
    senderCity: null,
    recipientCity: null,
    senderWarehouse: null,
    recipientWarehouse: null,
    recipientStreet: null,
    senderStreet: null,
    cargoDesc: null,
};
